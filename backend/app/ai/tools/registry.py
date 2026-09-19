from typing import Any
from sqlalchemy.orm import Session
from app.ai.retrieval import SchemeRetriever
from app.services.eligibility.evaluator import DeterministicEligibilityEvaluator
from app.services.eligibility.explanation import ExplanationGenerator
from app.services.eligibility.matching import SchemeMatchingEngine
from app.services.eligibility.completeness import ProfileCompletenessService

class ControlledToolRegistry:
    """
    Controlled Backend Tool Registry for the AI Assistant.
    Enforces strict Pydantic schemas and prevents arbitrary database access or SQL injection.
    """

    @staticmethod
    def search_schemes(db: Session, query: str | None = None, state: str | None = None, profession: str | None = None) -> list[dict[str, Any]]:
        schemes = SchemeRetriever.search_published_schemes(db, query=query, state_code=state, profession=profession)
        results = []
        for s in schemes:
            sources = [src.source.url for src in s.sources if src.source]
            official_src = sources[0] if sources else None
            verified_date = s.published_at.strftime("%Y-%m-%d") if s.published_at else None
            results.append({
                "id": s.id,
                "name": s.name,
                "short_description": s.short_description,
                "government_level": str(s.government_level.value if hasattr(s.government_level, 'value') else s.government_level),
                "official_source": official_src,
                "last_verified_date": verified_date
            })
        return results

    @staticmethod
    def get_scheme_details(db: Session, identifier: str) -> dict[str, Any] | None:
        s = SchemeRetriever.get_published_scheme_by_id_or_name(db, identifier)
        if not s:
            return None

        sources = [src.source.url for src in s.sources if src.source]
        official_src = sources[0] if sources else None
        verified_date = s.published_at.strftime("%Y-%m-%d") if s.published_at else None

        benefits = [{"title": b.title, "description": b.description, "amount": b.amount_financial_benefit} for b in s.benefits]
        documents = [{"name": doc.document.name if doc.document else "Document", "is_mandatory": doc.mandatory, "condition": doc.condition} for doc in s.documents]
        
        apps = []
        if s.application_process:
            ap = s.application_process
            steps = [{"step_number": st.step_number, "title": st.title, "instructions": st.instructions} for st in ap.steps]
            apps.append({
                "mode": str(ap.application_mode.value if hasattr(ap.application_mode, 'value') else ap.application_mode),
                "portal_url": ap.official_application_url,
                "instructions": ap.instructions,
                "steps": steps
            })

        return {
            "id": s.id,
            "name": s.name,
            "short_description": s.short_description,
            "government_level": str(s.government_level.value if hasattr(s.government_level, 'value') else s.government_level),
            "benefits": benefits,
            "documents": documents,
            "application_processes": apps,
            "official_source": official_src,
            "last_verified_date": verified_date
        }

    @staticmethod
    def evaluate_eligibility(db: Session, profile_data: dict, scheme_id: str | None = None) -> list[dict[str, Any]]:
        if scheme_id:
            s = SchemeRetriever.get_published_scheme_by_id_or_name(db, scheme_id)
            if not s:
                return []
            param_map = ProfileCompletenessService._get_param_map(db)
            res = DeterministicEligibilityEvaluator.evaluate_scheme(s, profile_data, param_map)
            ExplanationGenerator.generate_explanations(res)
            return [res.model_dump()]
        else:
            match_resp = SchemeMatchingEngine.match_schemes(db, profile_data)
            all_evals = match_resp.eligible_schemes + match_resp.unknown_schemes + match_resp.not_eligible_schemes
            return [e.model_dump() for e in all_evals]

    @staticmethod
    def get_required_documents(db: Session, scheme_id: str) -> list[dict[str, Any]]:
        s = SchemeRetriever.get_published_scheme_by_id_or_name(db, scheme_id)
        if not s:
            return []
        return [
            {
                "document_name": doc.document.name if doc.document else "Document",
                "is_mandatory": doc.mandatory,
                "conditional_requirement": doc.condition
            }
            for doc in s.documents
        ]

    @staticmethod
    def get_application_process(db: Session, scheme_id: str) -> dict[str, Any] | None:
        s = SchemeRetriever.get_published_scheme_by_id_or_name(db, scheme_id)
        if not s or not s.application_process:
            return None
        ap = s.application_process
        steps = [{"step_number": st.step_number, "title": st.title, "instructions": st.instructions} for st in ap.steps]
        return {
            "application_mode": str(ap.application_mode.value if hasattr(ap.application_mode, 'value') else ap.application_mode),
            "official_application_url": ap.official_application_url,
            "instructions": ap.instructions,
            "steps": steps
        }

    @staticmethod
    def compare_schemes(db: Session, scheme_ids: list[str]) -> list[dict[str, Any]]:
        results = []
        for sid in scheme_ids:
            dt = ControlledToolRegistry.get_scheme_details(db, sid)
            if dt:
                results.append(dt)
        return results
