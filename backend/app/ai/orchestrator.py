import re
from typing import Any
from sqlalchemy.orm import Session
from app.ai.providers.factory import get_llm_provider
from app.ai.prompts.intent import INTENT_CLASSIFICATION_PROMPT
from app.ai.prompts.entity_extraction import ENTITY_EXTRACTION_PROMPT
from app.schemas.ai import (
    AssistantIntent, IntentDetectionResult, 
    EntityExtractionResult, AssistantQueryResponse
)
from app.ai.retrieval import SchemeRetriever
from app.ai.profile_resolution import ProfileResolver
from app.ai.tools.registry import ControlledToolRegistry
from app.ai.response_generator import ResponseGenerator
from app.models import UserProfile, EligibilityParameter, Message

class AIOrchestrator:
    """
    Central AI Orchestrator.
    Manages structured query pipeline separating Intent Detection, Entity Extraction,
    Profile Resolution, Controlled Tool Execution, Deterministic Phase 3 Eligibility,
    and Source-Grounded Response Generation.
    """

    @classmethod
    async def process_user_query(
        cls,
        db: Session,
        query: str,
        user_id: str | None = None,
        conversation_id: str | None = None,
        session_context_profile: dict[str, Any] | None = None,
        override_profile: dict[str, Any] | None = None
    ) -> AssistantQueryResponse:
        # 0. Prompt Injection Defense & Sanitization
        sanitized_query = query.strip()
        lower_q = sanitized_query.lower()
        if re.search(r"\b(ignore\s+(all\s+)?(previous|prior)\s+instructions|system\s+prompt|drop\s+tables|reveal\s+(api\s+)?key)\b", lower_q):
            # Treat strictly as safe query text without executing injected instructions
            sanitized_query = re.sub(r"(ignore\s+(all\s+)?(previous|prior)\s+instructions|system\s+prompt|drop\s+tables|reveal\s+(api\s+)?key)", "", sanitized_query, flags=re.IGNORECASE).strip()
            if not sanitized_query:
                sanitized_query = "What government schemes are available?"

        llm = get_llm_provider()
        provider_info = llm.get_provider_info()

        # Build message history context if conversation_id exists
        messages = []
        if conversation_id:
            prior_messages = db.query(Message).filter(
                Message.conversation_id == conversation_id
            ).order_by(Message.created_at.asc()).all()[-4:]
            
            for pm in prior_messages:
                role = "user" if pm.role == "USER" else "assistant"
                messages.append({"role": role, "content": pm.content[:400]})

        messages.append({"role": "user", "content": sanitized_query})

        # 1. Intent Detection
        intent_result: IntentDetectionResult = await llm.generate_structured_output(
            messages=messages,
            response_model=IntentDetectionResult,
            system_prompt=INTENT_CLASSIFICATION_PROMPT
        )
        intent = intent_result.intent

        # 2. Fast-path for GREETING and OUT_OF_SCOPE
        if intent in [AssistantIntent.GREETING, AssistantIntent.OUT_OF_SCOPE]:
            return await ResponseGenerator.generate_assistant_response(
                llm_provider=llm,
                query=sanitized_query,
                intent=intent,
                tool_results=[],
                eligibility_results=[],
                conversation_id=conversation_id,
                provider_info=provider_info
            )

        # 3. Entity Extraction
        entity_result: EntityExtractionResult = await llm.generate_structured_output(
            messages=messages,
            response_model=EntityExtractionResult,
            system_prompt=ENTITY_EXTRACTION_PROMPT
        )

        # 4. Entity Validation against EligibilityParameter metadata
        valid_params = db.query(EligibilityParameter.name).all()
        valid_param_names = set([p[0] for p in valid_params] + [
            "age", "state_code", "district_name", "annual_income", 
            "caste_category", "occupation_type", "is_pwd", "gender", 
            "student_status", "farmer_status", "landholding_acres"
        ])
        
        validated_entities = {
            k: v for k, v in entity_result.entities.items() 
            if k in valid_param_names and v is not None
        }

        # 5. Profile Resolution
        stored_profile_dict = None
        if user_id:
            user_prof = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
            if user_prof:
                stored_profile_dict = {
                    "age": user_prof.age,
                    "gender": user_prof.gender,
                    "state_code": user_prof.state_code,
                    "district_name": user_prof.district_name,
                    "annual_income": user_prof.annual_family_income,
                    "caste_category": user_prof.caste_category,
                    "occupation_type": user_prof.occupation_type,
                    "is_pwd": user_prof.is_pwd
                }

        effective_profile = ProfileResolver.resolve_effective_profile(
            stored_profile=stored_profile_dict,
            extracted_entities=validated_entities,
            session_context_profile=session_context_profile,
            override_profile=override_profile
        )

        # 6. Tool Execution & Deterministic Phase 3 Integration
        tool_results: list[dict[str, Any]] = []
        eligibility_results: list[dict[str, Any]] = []

        if intent in [AssistantIntent.SCHEME_SEARCH, AssistantIntent.GENERAL_GOVERNMENT_SCHEME_QUERY]:
            search_query = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else sanitized_query
            tool_results = ControlledToolRegistry.search_schemes(
                db, 
                query=search_query, 
                state=effective_profile.get("state_code"),
                profession=effective_profile.get("occupation_type")
            )
            # Perform eligibility evaluation only if explicit profile was provided by caller
            if override_profile:
                eligibility_results = ControlledToolRegistry.evaluate_eligibility(db, effective_profile)

        elif intent in [AssistantIntent.ELIGIBILITY_CHECK, AssistantIntent.WHY_NOT_ELIGIBLE]:
            target_scheme = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else None
            eligibility_results = ControlledToolRegistry.evaluate_eligibility(db, effective_profile, scheme_id=target_scheme)
            if eligibility_results:
                for e in eligibility_results:
                    dt = ControlledToolRegistry.get_scheme_details(db, e["scheme_id"])
                    if dt:
                        tool_results.append(dt)

        elif intent == AssistantIntent.DOCUMENT_QUERY:
            target_scheme = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else None
            schemes = SchemeRetriever.search_published_schemes(db, query=target_scheme, limit=10) if target_scheme else SchemeRetriever.search_published_schemes(db, limit=10)
            target_obj = None
            if schemes:
                for sc in schemes:
                    if sc.name.lower() in sanitized_query.lower() or sanitized_query.lower() in sc.name.lower():
                        target_obj = sc
                        break
                if not target_obj:
                    target_obj = schemes[0]
            if target_obj:
                docs = ControlledToolRegistry.get_required_documents(db, target_obj.id)
                tool_results.append({
                    "id": target_obj.id,
                    "name": target_obj.name, 
                    "short_description": target_obj.short_description,
                    "official_source": target_obj.sources[0].source.url if target_obj.sources and target_obj.sources[0].source else None,
                    "documents": docs
                })

        elif intent == AssistantIntent.APPLICATION_GUIDANCE:
            target_scheme = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else None
            schemes = SchemeRetriever.search_published_schemes(db, query=target_scheme, limit=10) if target_scheme else SchemeRetriever.search_published_schemes(db, limit=10)
            target_obj = None
            if schemes:
                for sc in schemes:
                    if sc.name.lower() in sanitized_query.lower() or sanitized_query.lower() in sc.name.lower():
                        target_obj = sc
                        break
                if not target_obj:
                    target_obj = schemes[0]
            if target_obj:
                app_proc = ControlledToolRegistry.get_application_process(db, target_obj.id)
                tool_results.append({
                    "id": target_obj.id,
                    "name": target_obj.name,
                    "short_description": target_obj.short_description,
                    "official_source": target_obj.sources[0].source.url if target_obj.sources and target_obj.sources[0].source else None,
                    "application_process": app_proc
                })

        elif intent == AssistantIntent.BENEFIT_QUERY:
            target_scheme = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else None
            if target_scheme:
                dt = ControlledToolRegistry.get_scheme_details(db, target_scheme)
                if dt:
                    tool_results.append(dt)
            else:
                tool_results = ControlledToolRegistry.search_schemes(db, query=sanitized_query)

        elif intent == AssistantIntent.OFFICIAL_SOURCE_QUERY:
            target_scheme = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else None
            if target_scheme:
                dt = ControlledToolRegistry.get_scheme_details(db, target_scheme)
                if dt:
                    tool_results.append(dt)
            else:
                tool_results = ControlledToolRegistry.search_schemes(db, query=sanitized_query)

        elif intent == AssistantIntent.SCHEME_DETAILS:
            target_scheme = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else sanitized_query
            dt = ControlledToolRegistry.get_scheme_details(db, target_scheme)
            if dt:
                tool_results.append(dt)

        elif intent == AssistantIntent.COMPARE_SCHEMES:
            scheme_names = entity_result.extracted_scheme_names
            if not scheme_names:
                schemes = SchemeRetriever.search_published_schemes(db, limit=2)
                scheme_names = [s.id for s in schemes]
            tool_results = ControlledToolRegistry.compare_schemes(db, scheme_names)

        else:
            # General fallback search
            tool_results = ControlledToolRegistry.search_schemes(db, query=sanitized_query)

        # 7. Grounded Response Generation
        return await ResponseGenerator.generate_assistant_response(
            llm_provider=llm,
            query=sanitized_query,
            intent=intent,
            tool_results=tool_results,
            eligibility_results=eligibility_results,
            conversation_id=conversation_id,
            provider_info=provider_info
        )
