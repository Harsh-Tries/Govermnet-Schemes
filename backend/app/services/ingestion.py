import json
from sqlalchemy.orm import Session
from app.models import (
    Scheme, SchemeCategoryMap, SchemeBeneficiary, 
    SchemeProfession, SchemeState, SchemeDistrict,
    EligibilityRuleGroup, EligibilityRule, SchemeBenefit,
    OfficialSource, SchemeSource
)
from app.enums import GovernmentLevel, SchemeType, SchemeStatus, RuleOperator, BenefitType, SourceType

class SchemeIngestionService:
    """
    Ingestion service that parses structured JSON payloads into canonical Scheme, 
    Rule, Benefit, and Source database models.
    """

    @staticmethod
    def ingest_scheme_payload(db: Session, payload: dict) -> Scheme:
        name = payload.get("name")
        slug = payload.get("slug")
        if not name or not slug:
            raise ValueError("Scheme payload must contain 'name' and 'slug'.")

        existing = db.query(Scheme).filter(Scheme.slug == slug).first()
        if existing:
            db.delete(existing)
            db.commit()

        scheme = Scheme(
            name=name,
            slug=slug,
            short_description=payload.get("short_description", "Demo scheme summary"),
            description=payload.get("description", "Detailed demo scheme guidance"),
            government_level=GovernmentLevel(payload.get("government_level", "CENTRAL")),
            scheme_type=SchemeType(payload.get("scheme_type", "GRANT")),
            status=SchemeStatus(payload.get("status", "DRAFT")),
            administering_ministry=payload.get("administering_ministry", "Demo Ministry"),
            funding_ratio=payload.get("funding_ratio", "100% Central")
        )
        db.add(scheme)
        db.commit()
        db.refresh(scheme)

        # 1. Attach Categories
        for cat_id in payload.get("category_ids", []):
            db.add(SchemeCategoryMap(scheme_id=scheme.id, category_id=cat_id))

        # 2. Attach Beneficiaries
        for ben_id in payload.get("beneficiary_type_ids", []):
            db.add(SchemeBeneficiary(scheme_id=scheme.id, beneficiary_type_id=ben_id))

        # 3. Attach Professions
        for prof_id in payload.get("profession_ids", []):
            db.add(SchemeProfession(scheme_id=scheme.id, profession_id=prof_id))

        # 4. Attach States
        for scode in payload.get("state_codes", []):
            db.add(SchemeState(scheme_id=scheme.id, state_code=scode))

        # 5. Ingest Eligibility Rules
        rules_data = payload.get("rules", [])
        if rules_data:
            group = EligibilityRuleGroup(scheme_id=scheme.id, logical_operator="AND")
            db.add(group)
            db.commit()
            db.refresh(group)

            for r in rules_data:
                rule = EligibilityRule(
                    group_id=group.id,
                    parameter_name=r["parameter_name"],
                    operator=RuleOperator(r["operator"]),
                    comparison_value=r["comparison_value"],
                    is_mandatory=r.get("is_mandatory", True),
                    failure_message=r.get("failure_message")
                )
                db.add(rule)

        # 6. Ingest Benefits
        for b in payload.get("benefits", []):
            benefit = SchemeBenefit(
                scheme_id=scheme.id,
                benefit_type=BenefitType(b.get("benefit_type", "FINANCIAL_ASSISTANCE")),
                title=b["title"],
                description=b["description"],
                amount=b.get("amount"),
                amount_unit=b.get("amount_unit"),
                frequency=b.get("frequency")
            )
            db.add(benefit)

        # 7. Ingest Sources
        for s in payload.get("sources", []):
            source = OfficialSource(
                url=s["url"],
                source_type=SourceType(s.get("source_type", "OFFICIAL_PORTAL")),
                authority=s.get("authority", "Demo Authority"),
                title=s.get("title", "Demo Source")
            )
            db.add(source)
            db.commit()
            db.refresh(source)
            db.add(SchemeSource(scheme_id=scheme.id, source_id=source.id, notes=s.get("notes")))

        db.commit()
        db.refresh(scheme)
        return scheme
