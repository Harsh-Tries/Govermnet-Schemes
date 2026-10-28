from typing import Any
from app.ai.providers.base import LLMProvider
from app.ai.prompts.response_generation import RESPONSE_GENERATION_PROMPT
from app.schemas.ai import AssistantQueryResponse, AssistantIntent, SourceInfoDTO
from app.ai.clarification import ClarificationEngine

class ResponseGenerator:
    """
    Source-Grounded Response Generator.
    Summarizes verified tool & Phase 3 eligibility outputs into natural language responses,
    strictly enforcing citation sources and zero hallucination rules.
    """

    @staticmethod
    async def generate_assistant_response(
        llm_provider: LLMProvider,
        query: str,
        intent: AssistantIntent,
        tool_results: list[dict[str, Any]],
        eligibility_results: list[dict[str, Any]],
        conversation_id: str | None = None,
        provider_info: dict[str, Any] | None = None
    ) -> AssistantQueryResponse:
        sources: list[SourceInfoDTO] = []
        schemes_metadata: list[dict[str, Any]] = []
        missing_info: list[str] = []
        requires_clarification = False

        if provider_info is None:
            provider_info = llm_provider.get_provider_info()

        # Collect sources and metadata
        for t in tool_results:
            if "official_source" in t and t["official_source"]:
                sources.append(SourceInfoDTO(
                    title=f"Official Portal - {t.get('name', 'Scheme')}",
                    url=t["official_source"],
                    last_verified=t.get("last_verified_date")
                ))
            if "sources" in t and isinstance(t["sources"], list):
                for s_item in t["sources"]:
                    if isinstance(s_item, dict) and "url" in s_item:
                        sources.append(SourceInfoDTO(
                            title=s_item.get("title", f"Official Portal - {t.get('name', 'Scheme')}"),
                            url=s_item["url"],
                            last_verified=t.get("last_verified_date")
                        ))
                    elif isinstance(s_item, str):
                        sources.append(SourceInfoDTO(
                            title=f"Official Portal - {t.get('name', 'Scheme')}",
                            url=s_item,
                            last_verified=t.get("last_verified_date")
                        ))
            schemes_metadata.append(t)

        # Check eligibility results for UNKNOWN states and failed conditions
        for e in eligibility_results:
            if e.get("status") == "UNKNOWN" and e.get("missing_information"):
                missing_info.extend(e["missing_information"])
                requires_clarification = True
            if "official_source" in e and e["official_source"]:
                sources.append(SourceInfoDTO(
                    title=f"Official Portal - {e.get('scheme_name', 'Scheme')}",
                    url=e["official_source"],
                    last_verified=e.get("last_verified_date")
                ))

        # Remove duplicate sources
        unique_sources = list({s.url: s for s in sources}.values())

        # 1. Handle Greetings
        if intent == AssistantIntent.GREETING:
            greeting_msg = (
                "Namaste! I am the Maharashtra Government Schemes and Scholarships Assistant. "
                "I can help you explore verified State and Central welfare schemes, evaluate your eligibility "
                "against official guidelines, and provide application procedures and required document checklists."
            )
            return AssistantQueryResponse(
                message=greeting_msg,
                intent=intent,
                schemes=[],
                eligibility_results=[],
                missing_information=[],
                sources=[],
                requires_clarification=False,
                conversation_id=conversation_id,
                provider_info=provider_info
            )

        # 2. Handle Out-of-Scope
        if intent == AssistantIntent.OUT_OF_SCOPE:
            out_scope_msg = (
                "I specialize exclusively in Indian government schemes, scholarships, and citizen welfare programs "
                "(with focused expertise on Maharashtra). Please ask a question related to schemes, citizen eligibility, or government benefits."
            )
            return AssistantQueryResponse(
                message=out_scope_msg,
                intent=intent,
                schemes=[],
                eligibility_results=[],
                missing_information=[],
                sources=[],
                requires_clarification=False,
                conversation_id=conversation_id,
                provider_info=provider_info
            )

        # 3. Handle Clarification Required
        if intent == AssistantIntent.CLARIFICATION_REQUIRED or (requires_clarification and missing_info):
            scheme_name = eligibility_results[0].get("scheme_name", "this scheme") if eligibility_results else "government schemes"
            clarification_msg = ClarificationEngine.generate_clarification_prompt(scheme_name, list(set(missing_info)))
            return AssistantQueryResponse(
                message=clarification_msg,
                intent=intent,
                schemes=schemes_metadata,
                eligibility_results=eligibility_results,
                missing_information=list(set(missing_info)),
                sources=unique_sources,
                requires_clarification=True,
                conversation_id=conversation_id,
                provider_info=provider_info
            )

        # 4. Handle Empty Retrieval Search
        if intent in [AssistantIntent.SCHEME_SEARCH, AssistantIntent.SCHEME_DETAILS, AssistantIntent.GENERAL_GOVERNMENT_SCHEME_QUERY] and not tool_results and not eligibility_results:
            empty_msg = (
                "We could not find any verified government schemes in our knowledge base matching your query. "
                "Please check the spelling or keywords, or explore our verified Maharashtra catalog covering Scholarships, "
                "Agriculture, Women & Child, Health, and Housing schemes."
            )
            return AssistantQueryResponse(
                message=empty_msg,
                intent=intent,
                schemes=[],
                eligibility_results=[],
                missing_information=[],
                sources=[],
                requires_clarification=False,
                conversation_id=conversation_id,
                provider_info=provider_info
            )

        # 5. Build grounded context string
        context_str = (
            f"USER QUERY: {query}\n"
            f"INTENT: {intent.value}\n"
            f"VERIFIED TOOL RESULTS:\n{tool_results}\n"
            f"PHASE 3 ELIGIBILITY RESULTS:\n{eligibility_results}"
        )

        messages = [
            {"role": "user", "content": context_str}
        ]

        text_response = await llm_provider.generate_response(
            messages=messages,
            system_prompt=RESPONSE_GENERATION_PROMPT,
            temperature=0.2
        )

        return AssistantQueryResponse(
            message=text_response,
            intent=intent,
            schemes=schemes_metadata,
            eligibility_results=eligibility_results,
            missing_information=list(set(missing_info)),
            sources=unique_sources,
            requires_clarification=requires_clarification,
            conversation_id=conversation_id,
            provider_info=provider_info
        )
