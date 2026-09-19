import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import (
    State, District, SchemeCategory, BeneficiaryType, Profession,
    EligibilityParameter, Scheme, SchemeCategoryMap, SchemeBeneficiary,
    EligibilityRuleGroup, EligibilityRule, SchemeBenefit, OfficialSource, SchemeSource,
    VerificationRecord
)
from app.enums import (
    GovernmentLevel, SchemeType, SchemeStatus, ParameterDataType, RuleOperator, 
    BenefitType, SourceType
)

def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("[INFO] Seeding reference taxonomy and DEMO DATA...")

        # 1. States
        mp_state = db.query(State).filter(State.code == "IN-MP").first()
        if not mp_state:
            mp_state = State(code="IN-MP", name="Madhya Pradesh", type="STATE")
            mh_state = State(code="IN-MH", name="Maharashtra", type="STATE")
            db.add_all([mp_state, mh_state])
            db.commit()

        # 2. Categories
        cat_scholarship = db.query(SchemeCategory).filter(SchemeCategory.code == "SCHOLARSHIP").first()
        if not cat_scholarship:
            cat_scholarship = SchemeCategory(code="SCHOLARSHIP", name="Scholarships & Higher Education Aid")
            cat_agriculture = SchemeCategory(code="AGRICULTURE", name="Agriculture & Rural Subsidies")
            cat_entrepreneur = SchemeCategory(code="ENTREPRENEURSHIP", name="MSME & Entrepreneurship Credit")
            cat_social = SchemeCategory(code="SOCIAL_SECURITY", name="Social Security & Pensions")
            db.add_all([cat_scholarship, cat_agriculture, cat_entrepreneur, cat_social])
            db.commit()

        # 3. Beneficiaries
        ben_student = db.query(BeneficiaryType).filter(BeneficiaryType.code == "STUDENT").first()
        if not ben_student:
            ben_student = BeneficiaryType(code="STUDENT", name="Student Aspirants")
            ben_farmer = BeneficiaryType(code="FARMER", name="Farmers & Cultivators")
            ben_entrepreneur = BeneficiaryType(code="ENTREPRENEUR", name="Micro Entrepreneurs")
            ben_senior = BeneficiaryType(code="SENIOR_CITIZEN", name="Senior Citizens")
            db.add_all([ben_student, ben_farmer, ben_entrepreneur, ben_senior])
            db.commit()

        # 4. Eligibility Parameters
        param_income = db.query(EligibilityParameter).filter(EligibilityParameter.name == "annual_income").first()
        if not param_income:
            param_income = EligibilityParameter(
                name="annual_income", display_name="Annual Family Income", 
                data_type=ParameterDataType.FLOAT, category="SOCIOECONOMIC", unit="INR"
            )
            param_age = EligibilityParameter(
                name="age", display_name="Age in Years", 
                data_type=ParameterDataType.INTEGER, category="DEMOGRAPHICS", unit="Years"
            )
            param_land = EligibilityParameter(
                name="landholding_acres", display_name="Landholding Area", 
                data_type=ParameterDataType.FLOAT, category="SPECIAL_CONDITIONS", unit="Acres"
            )
            db.add_all([param_income, param_age, param_land])
            db.commit()

        # 5. DEMO SCHEME 1: Scholarship (Published)
        scheme_1 = db.query(Scheme).filter(Scheme.slug == "demo-higher-education-scholarship-2026").first()
        if not scheme_1:
            scheme_1 = Scheme(
                name="DEMO SCHOLARSHIP 2026 (FICTIONAL TEST DATA)",
                slug="demo-higher-education-scholarship-2026",
                short_description="Fictional test scholarship providing tuition fee waiver for eligible students.",
                description="DEMO DATA: For API testing purposes only. Provides tuition grant for post-matric students.",
                government_level=GovernmentLevel.CENTRAL,
                scheme_type=SchemeType.SCHOLARSHIP,
                status=SchemeStatus.PUBLISHED,
                administering_ministry="Demo Ministry of Education",
                funding_ratio="100% Central"
            )
            db.add(scheme_1)
            db.commit()

            db.add(SchemeCategoryMap(scheme_id=scheme_1.id, category_id=cat_scholarship.id))
            db.add(SchemeBeneficiary(scheme_id=scheme_1.id, beneficiary_type_id=ben_student.id))

            # Rules
            grp1 = EligibilityRuleGroup(scheme_id=scheme_1.id, logical_operator="AND")
            db.add(grp1)
            db.commit()

            db.add(EligibilityRule(
                group_id=grp1.id, parameter_name="annual_income",
                operator=RuleOperator.LESS_THAN_OR_EQUAL, comparison_value=250000,
                failure_message="Income exceeds ₹2.5 Lakh cap"
            ))

            # Benefit
            db.add(SchemeBenefit(
                scheme_id=scheme_1.id, benefit_type=BenefitType.SCHOLARSHIP,
                title="Tuition Fee Grant", description="100% Tuition fee waiver up to ₹50,000 / year",
                amount=50000, amount_unit="INR/year"
            ))

            # Source
            source1 = OfficialSource(
                url="https://example.gov.in/demo-scholarship-policy",
                source_type=SourceType.OFFICIAL_PORTAL,
                authority="Demo Central Board",
                title="Demo Scholarship Policy Gazette Notification"
            )
            db.add(source1)
            db.commit()
            db.add(SchemeSource(scheme_id=scheme_1.id, source_id=source1.id, notes="Verified demo source"))

            # Verification Record
            db.add(VerificationRecord(
                scheme_id=scheme_1.id,
                verification_status=SchemeStatus.PUBLISHED,
                notes="Verified demo seed scheme for automated testing",
                source_reviewed=source1.url
            ))

        # 6. DEMO SCHEME 2: Farmer Aid (Source Verified)
        scheme_2 = db.query(Scheme).filter(Scheme.slug == "demo-farmer-drip-irrigation-2026").first()
        if not scheme_2:
            scheme_2 = Scheme(
                name="DEMO FARMER DRIP AID 2026 (FICTIONAL TEST DATA)",
                slug="demo-farmer-drip-irrigation-2026",
                short_description="Fictional subsidy for micro-irrigation equipment for small farmers.",
                description="DEMO DATA: Fictional equipment grant for testing farmer scheme workflows.",
                government_level=GovernmentLevel.STATE,
                scheme_type=SchemeType.SUBSIDY,
                status=SchemeStatus.SOURCE_VERIFIED,
                administering_ministry="Demo Department of Agriculture"
            )
            db.add(scheme_2)
            db.commit()

            db.add(SchemeCategoryMap(scheme_id=scheme_2.id, category_id=cat_agriculture.id))
            db.add(SchemeBeneficiary(scheme_id=scheme_2.id, beneficiary_type_id=ben_farmer.id))

            # Source
            source2 = OfficialSource(
                url="https://example.gov.in/demo-farmer-drip-policy",
                source_type=SourceType.MINISTRY_CIRCULAR,
                authority="Demo State Agriculture Dept",
                title="Demo Drip Subsidy Circular"
            )
            db.add(source2)
            db.commit()
            db.add(SchemeSource(scheme_id=scheme_2.id, source_id=source2.id))

        db.commit()
        print("[SUCCESS] Demo data successfully seeded!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
