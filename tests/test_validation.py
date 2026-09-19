import pytest
from app.schemas.scheme import SchemePublishValidation
from app.enums import GovernmentLevel

def test_valid_scheme_publish_validation():
    validation = SchemePublishValidation(
        name="Valid Published Scheme",
        short_description="Valid description with more than 10 characters",
        government_level=GovernmentLevel.CENTRAL,
        has_categories=True,
        has_beneficiaries=True,
        has_sources=True,
        is_source_verified=True
    )
    assert validation.name == "Valid Published Scheme"

def test_incomplete_scheme_publish_validation_fails():
    with pytest.raises(ValueError) as exc:
        SchemePublishValidation(
            name="Incomplete Scheme",
            short_description="Short desc",
            government_level=GovernmentLevel.CENTRAL,
            has_categories=False, # Missing category
            has_beneficiaries=True,
            has_sources=True,
            is_source_verified=False # Unverified source
        )
    assert "At least one Scheme Category must be mapped" in str(exc.value)
    assert "Scheme must undergo source verification" in str(exc.value)
