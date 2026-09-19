from app.models import (
    Scheme, SchemeCategory, BeneficiaryType, SchemeCategoryMap, SchemeBeneficiary
)
from app.enums import GovernmentLevel, SchemeType, SchemeStatus

def test_scheme_model_creation(db_session):
    cat = SchemeCategory(code="EDUCATION", name="Education Aid")
    ben = BeneficiaryType(code="STUDENT", name="Student")
    db_session.add_all([cat, ben])
    db_session.commit()

    scheme = Scheme(
        name="Test Scheme 2026",
        slug="test-scheme-2026",
        short_description="Short summary",
        government_level=GovernmentLevel.CENTRAL,
        scheme_type=SchemeType.SCHOLARSHIP,
        status=SchemeStatus.DRAFT
    )
    db_session.add(scheme)
    db_session.commit()

    db_session.add(SchemeCategoryMap(scheme_id=scheme.id, category_id=cat.id))
    db_session.add(SchemeBeneficiary(scheme_id=scheme.id, beneficiary_type_id=ben.id))
    db_session.commit()

    fetched = db_session.query(Scheme).filter(Scheme.id == scheme.id).first()
    assert fetched is not None
    assert fetched.name == "Test Scheme 2026"
    assert len(fetched.categories) == 1
    assert fetched.categories[0].category.code == "EDUCATION"
    assert len(fetched.beneficiaries) == 1
    assert fetched.beneficiaries[0].beneficiary_type.code == "STUDENT"
