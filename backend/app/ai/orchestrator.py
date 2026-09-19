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
from app.models import UserProfile, EligibilityParameter

class AIOrchestrator:
    """
    Central AI Orchestrator.
    Manages structured query pipeline separating Intent Detection, Entity Extraction,
    Profile Resolution, Controlled Tool Execution, Deterministic Phase 3 Eligibility,
    and Source-Grounded Response Generation.
    """

    @classmethod
    async def process_user_query(
        self,
        db: Session,
        query: str,
        user_id: str | None = None,
        conversation_id: str | None = None,
        session_context_profile: dict[str, Any] | None = None,
        override_profile: dict[str, Any] | None = None
    ) -> AssistantQueryResponse:
        llm = get_llm_provider()

        messages = [{"role": "user", "content": query}]

        # 1. Intent Detection
        intent_result: IntentDetectionResult = await llm.generate_structured_output(
            messages=messages,
            response_model=IntentDetectionResult,
            system_prompt=INTENT_CLASSIFICATION_PROMPT
        )
        intent = intent_result.intent

        # 2. Entity Extraction
        entity_result: EntityExtractionResult = await llm.generate_structured_output(
            messages=messages,
            response_model=EntityExtractionResult,
            system_prompt=ENTITY_EXTRACTION_PROMPT
        )

        # 3. Entity Validation against EligibilityParameter metadata
        valid_params = db.query(EligibilityParameter.name).all()
        valid_param_names = set([p[0] for p in valid_params] + [
            "age", "state_code", "district_name", "annual_income", 
            "caste_category", "occupation_type", "is_pwd", "gender", "student_status"
        ])
        
        validated_entities = {
            k: v for k, v in entity_result.entities.items() 
            if k in valid_param_names and v is not None
        }

        # 4. Profile Resolution
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

        # 5. Tool Execution & Phase 3 Integration
        tool_results: list[dict[str, Any]] = []
        eligibility_results: list[dict[str, Any]] = []

        if intent in [AssistantIntent.SCHEME_SEARCH, AssistantIntent.GENERAL_GOVERNMENT_SCHEME_QUERY]:
            search_query = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else query
            tool_results = ControlledToolRegistry.search_schemes(
                db, 
                query=search_query, 
                state=effective_profile.get("state_code"),
                profession=effective_profile.get("occupation_type")
            )
            # Perform eligibility evaluation if profile attributes exist
            if effective_profile:
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
                    if sc.name.lower() in query.lower() or query.lower() in sc.name.lower():
                        target_obj = sc
                        break
                if not target_obj:
                    target_obj = schemes[0]
            if target_obj:
                docs = ControlledToolRegistry.get_required_documents(db, target_obj.id)
                tool_results.append({"scheme_name": target_obj.name, "documents": docs})

        elif intent == AssistantIntent.APPLICATION_GUIDANCE:
            target_scheme = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else None
            schemes = SchemeRetriever.search_published_schemes(db, query=target_scheme, limit=10) if target_scheme else SchemeRetriever.search_published_schemes(db, limit=10)
            target_obj = None
            if schemes:
                for sc in schemes:
                    if sc.name.lower() in query.lower() or query.lower() in sc.name.lower():
                        target_obj = sc
                        break
                if not target_obj:
                    target_obj = schemes[0]
            if target_obj:
                app_proc = ControlledToolRegistry.get_application_process(db, target_obj.id)
                tool_results.append({"scheme_name": target_obj.name, "application_process": app_proc})

        elif intent == AssistantIntent.SCHEME_DETAILS:
            target_scheme = entity_result.extracted_scheme_names[0] if entity_result.extracted_scheme_names else query
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
            tool_results = ControlledToolRegistry.search_schemes(db, query=query)

        # 6. Response Generation
        return await ResponseGenerator.generate_assistant_response(
            llm_provider=llm,
            query=query,
            intent=intent,
            tool_results=tool_results,
            eligibility_results=eligibility_results,
            conversation_id=conversation_id
        )
