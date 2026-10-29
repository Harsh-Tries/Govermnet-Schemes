import re
from typing import Any
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload
from app.enums import SchemeStatus, GovernmentLevel
from app.models import (
    Scheme, SchemeCategoryMap, SchemeCategory,
    SchemeProfession, SchemeBeneficiary, SchemeState,
    BeneficiaryType
)

class SchemeRetriever:
    """
    Modular Scheme Retrieval Service.
    Retrieves ONLY schemes with status='PUBLISHED'.
    Prevents draft, under_review, or archived schemes from reaching public AI responses.
    Supports structured SQL constraints and transparent hybrid search.
    """

    @staticmethod
    def search_published_schemes(
        db: Session, 
        query: str | None = None,
        state_code: str | None = None,
        category: str | None = None,
        profession: str | None = None,
        beneficiary_type: str | None = None,
        government_level: GovernmentLevel | None = None,
        limit: int = 10
    ) -> list[Scheme]:
        q = db.query(Scheme).filter(Scheme.status == SchemeStatus.PUBLISHED)

        if government_level:
            q = q.filter(Scheme.government_level == government_level)

        if query:
            clean_q = query.strip()
            # Stop words to ignore when splitting into keywords
            stop_words = {
                "find", "schemes", "scheme", "for", "what", "which", "are", 
                "the", "available", "all", "me", "my", "is", "in", "to", 
                "and", "of", "do", "i", "need", "about", "show", "get", "give"
            }
            words = [w.lower() for w in re.findall(r"\b[a-zA-Z0-9_\-]+\b", clean_q)]
            meaningful_words = [w for w in words if w not in stop_words and len(w) > 2]
            
            raw_tokens = meaningful_words if meaningful_words else words
            if not raw_tokens:
                raw_tokens = [clean_q.lower()]

            terms = set()
            for t in raw_tokens:
                terms.add(t)
                # Handle plurals/singulars
                if t.endswith("ies") and len(t) > 4:
                    terms.add(t[:-3] + "y")
                elif t.endswith("s") and len(t) > 3:
                    terms.add(t[:-1])
                elif not t.endswith("s"):
                    terms.add(t + "s")

            filters = []
            for term in terms:
                pattern = f"%{term}%"
                filters.append(Scheme.name.ilike(pattern))
                filters.append(Scheme.short_description.ilike(pattern))
                filters.append(Scheme.description.ilike(pattern))
                filters.append(Scheme.slug.ilike(pattern))
                filters.append(Scheme.administering_ministry.ilike(pattern))
                filters.append(
                    Scheme.categories.any(
                        SchemeCategoryMap.category.has(
                            or_(
                                SchemeCategory.name.ilike(pattern),
                                SchemeCategory.code.ilike(pattern)
                            )
                        )
                    )
                )
                filters.append(
                    Scheme.beneficiaries.any(
                        SchemeBeneficiary.beneficiary_type.has(
                            or_(
                                BeneficiaryType.name.ilike(pattern),
                                BeneficiaryType.code.ilike(pattern)
                            )
                        )
                    )
                )

            q = q.filter(or_(*filters))

        if state_code:
            norm_state = "IN-MH" if state_code.upper() in ["MH", "IN-MH", "MAHARASHTRA"] else state_code
            # Match either explicitly linked state or Central schemes available nationwide/in state
            q = q.filter(
                or_(
                    Scheme.states.any(SchemeState.state_code.ilike(norm_state)),
                    Scheme.government_level == GovernmentLevel.CENTRAL
                )
            )

        if category:
            q = q.filter(
                or_(
                    Scheme.categories.any(
                        or_(
                            SchemeCategoryMap.category_id.ilike(f"%{category}%"),
                            SchemeCategoryMap.category.has(
                                or_(
                                    SchemeCategory.name.ilike(f"%{category}%"),
                                    SchemeCategory.code.ilike(f"%{category}%")
                                )
                            )
                        )
                    ),
                    Scheme.description.ilike(f"%{category}%"),
                    Scheme.short_description.ilike(f"%{category}%")
                )
            )

        if profession:
            q = q.filter(
                or_(
                    Scheme.professions.any(SchemeProfession.profession_id.ilike(f"%{profession}%")),
                    Scheme.beneficiaries.any(
                        SchemeBeneficiary.beneficiary_type.has(
                            or_(
                                BeneficiaryType.code.ilike(f"%{profession}%"),
                                BeneficiaryType.name.ilike(f"%{profession}%")
                            )
                        )
                    ),
                    Scheme.description.ilike(f"%{profession}%"),
                    Scheme.short_description.ilike(f"%{profession}%"),
                    Scheme.name.ilike(f"%{profession}%")
                )
            )

        if beneficiary_type:
            q = q.filter(
                or_(
                    Scheme.beneficiaries.any(
                        or_(
                            SchemeBeneficiary.beneficiary_type_id.ilike(f"%{beneficiary_type}%"),
                            SchemeBeneficiary.beneficiary_type.has(
                                or_(
                                    BeneficiaryType.code.ilike(f"%{beneficiary_type}%"),
                                    BeneficiaryType.name.ilike(f"%{beneficiary_type}%")
                                )
                            )
                        )
                    ),
                    Scheme.description.ilike(f"%{beneficiary_type}%"),
                    Scheme.short_description.ilike(f"%{beneficiary_type}%")
                )
            )

        return q.options(
            selectinload(Scheme.rule_groups),
            selectinload(Scheme.benefits),
            selectinload(Scheme.documents),
            joinedload(Scheme.application_process),
            selectinload(Scheme.sources)
        ).distinct().limit(limit).all()

    @staticmethod
    def get_published_scheme_by_id_or_name(db: Session, identifier: str) -> Scheme | None:
        """Look up a published scheme by UUID, exact slug, or fuzzy name match."""
        if not identifier:
            return None
            
        clean_id = identifier.strip()

        # 1. Exact UUID or slug match
        scheme = db.query(Scheme).options(
            selectinload(Scheme.rule_groups),
            selectinload(Scheme.benefits),
            selectinload(Scheme.documents),
            joinedload(Scheme.application_process),
            selectinload(Scheme.sources)
        ).filter(
            (Scheme.status == SchemeStatus.PUBLISHED) &
            ((Scheme.id == clean_id) | (Scheme.slug == clean_id))
        ).first()

        if scheme:
            return scheme

        # 2. Fuzzy name or slug substring match
        return db.query(Scheme).options(
            selectinload(Scheme.rule_groups),
            selectinload(Scheme.benefits),
            selectinload(Scheme.documents),
            joinedload(Scheme.application_process),
            selectinload(Scheme.sources)
        ).filter(
            (Scheme.status == SchemeStatus.PUBLISHED) &
            (Scheme.name.ilike(f"%{clean_id}%") | Scheme.slug.ilike(f"%{clean_id}%"))
        ).first()

    @classmethod
    async def hybrid_retrieve(
        cls,
        db: Session,
        query: str,
        state_code: str | None = None,
        limit: int = 10
    ) -> list[Scheme]:
        """
        Hybrid retrieval integrating keyword SQL search with semantic vector search when available.
        Falls back cleanly to structured keyword search if vector embeddings are unpopulated.
        """
        try:
            from app.services.vector.hybrid_retriever import HybridRetriever
            from app.models.vector import SchemeChunk
            has_chunks = db.query(SchemeChunk).first() is not None
            if has_chunks:
                return await HybridRetriever.hybrid_search(db, query=query, limit=limit)
        except Exception:
            pass

        return cls.search_published_schemes(db, query=query, state_code=state_code, limit=limit)
