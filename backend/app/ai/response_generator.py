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
        conversation_id: str | None = None
    ) -> AssistantQueryResponse:
        sources: list[SourceInfoDTO] = []
        schemes_metadata: list[dict[str, Any]] = []
        missing_info: list[str] = []
        requires_clarification = False

        # Collect sources and metadata
        for t in tool_results:
            if "official_source" in t and t["official_source"]:
                sources.append(SourceInfoDTO(
                    title=f"Official Portal - {t.get('name', 'Scheme')}",
                    url=t["official_source"],
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
        unique_sources = {s.url: s for s in sources}.values()

        # Handle specific intent response formatting
        if intent == AssistantIntent.CLARIFICATION_REQUIRED or (requires_clarification and missing_info):
            scheme_name = eligibility_results[0].get("scheme_name", "this scheme") if eligibility_results else "government schemes"
            clarification_msg = ClarificationEngine.generate_clarification_prompt(scheme_name, list(set(missing_info)))
            return AssistantQueryResponse(
                message=clarification_msg,
                intent=intent,
                schemes=schemes_metadata,
                eligibility_results=eligibility_results,
                missing_information=list(set(missing_info)),
                sources=list(unique_sources),
                requires_clarification=True,
                conversation_id=conversation_id
            )

        # Build grounded context string
        context_str = f"USER QUERY: {query}\nINTENT: {intent.value}\nVERIFIED TOOL RESULTS:\n{tool_results}\nPHASE 3 ELIGIBILITY RESULTS:\n{eligibility_results}"

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
            sources=list(unique_sources),
            requires_clarification=requires_clarification,
            conversation_id=conversation_id
        )
