from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.enums import SchemeStatus
from app.models import (
    Scheme, SchemeCategoryMap, 
    SchemeProfession, SchemeBeneficiary, SchemeState
)

class SchemeRetriever:
    """
    Modular Scheme Retrieval Service.
    Retrieves ONLY schemes with status='PUBLISHED'.
    Prevents draft, under_review, or archived schemes from reaching public AI responses.
    """

    @staticmethod
    def search_published_schemes(
        db: Session, 
        query: str | None = None,
        state_code: str | None = None,
        category: str | None = None,
        profession: str | None = None,
        beneficiary_type: str | None = None,
        limit: int = 10
    ) -> list[Scheme]:
        q = db.query(Scheme).filter(Scheme.status == SchemeStatus.PUBLISHED)

        if query:
            terms = [f"%{w.lower()}%" for w in query.split() if len(w) > 1]
            if not terms:
                terms = [f"%{query.lower()}%"]
            filters = []
            for t in terms:
                filters.append(Scheme.name.ilike(t))
                filters.append(Scheme.short_description.ilike(t))
                filters.append(Scheme.slug.ilike(t))
            q = q.filter(or_(*filters))

        if state_code:
            q = q.join(SchemeState).filter(SchemeState.state_code.ilike(state_code))

        if category:
            q = q.join(SchemeCategoryMap).filter(SchemeCategoryMap.category_id.ilike(f"%{category}%"))

        if profession:
            q = q.join(SchemeProfession).filter(SchemeProfession.profession_id.ilike(f"%{profession}%"))

        if beneficiary_type:
            q = q.join(SchemeBeneficiary).filter(SchemeBeneficiary.beneficiary_type_id.ilike(f"%{beneficiary_type}%"))

        return q.options(
            joinedload(Scheme.rule_groups),
            joinedload(Scheme.benefits),
            joinedload(Scheme.documents),
            joinedload(Scheme.application_process),
            joinedload(Scheme.sources)
        ).distinct().limit(limit).all()

    @staticmethod
    def get_published_scheme_by_id_or_name(db: Session, identifier: str) -> Scheme | None:
        return db.query(Scheme).options(
            joinedload(Scheme.rule_groups),
            joinedload(Scheme.benefits),
            joinedload(Scheme.documents),
            joinedload(Scheme.application_process),
            joinedload(Scheme.sources)
        ).filter(
            (Scheme.status == SchemeStatus.PUBLISHED) &
            ((Scheme.id == identifier) | (Scheme.slug == identifier) | (Scheme.name.ilike(f"%{identifier}%")))
        ).first()
