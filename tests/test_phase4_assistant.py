import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.models import (
    Scheme, EligibilityRuleGroup, EligibilityRule, 
    Document, SchemeDocument, ApplicationProcess, 
    ApplicationStep, OfficialSource, SchemeSource
)
from app.enums import GovernmentLevel, SchemeType, SchemeStatus, RuleOperator, DocumentType
from app.ai.providers.mock_provider import MockLocalProvider
from app.ai.orchestrator import AIOrchestrator
from app.schemas.ai import AssistantIntent

client = TestClient(app)

@pytest.mark.asyncio
async def test_case_1_user_asks_for_schemes(db_session):
    # CASE 1: User asks for schemes -> Search tool called
    response = await AIOrchestrator.process_user_query(
        db=db_session,
        query="What scholarships can I apply for?"
    )
    assert response.intent in [AssistantIntent.SCHEME_SEARCH, AssistantIntent.GENERAL_GOVERNMENT_SCHEME_QUERY]
    assert response.requires_clarification == False
    assert len(response.message) > 0

@pytest.mark.asyncio
async def test_case_2_eligibility_check_case(db_session):
    # Setup Published Scheme
    scheme = Scheme(
        name="TEST SCHOLARSHIP FOR ELIGIBILITY",
        slug="test-scholarship-eligibility",
        short_description="Test scheme for Phase 4 eligibility test",
        government_level=GovernmentLevel.CENTRAL,
        scheme_type=SchemeType.SCHOLARSHIP,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    grp = EligibilityRuleGroup(scheme_id=scheme.id, logical_operator="AND")
    db_session.add(grp)
    db_session.commit()

    rule1 = EligibilityRule(group_id=grp.id, parameter_name="age", operator=RuleOperator.GREATER_THAN_OR_EQUAL, comparison_value=18)
    rule2 = EligibilityRule(group_id=grp.id, parameter_name="state", operator=RuleOperator.EQUALS, comparison_value="MP")
    db_session.add_all([rule1, rule2])
    db_session.commit()

    # User profile matching rules (Age 20, State MP)
    profile = {"age": 20, "state_code": "MP"}

    response = await AIOrchestrator.process_user_query(
        db=db_session,
        query="Am I eligible for this scholarship?",
        override_profile=profile
    )

    assert response.intent in [AssistantIntent.ELIGIBILITY_CHECK, AssistantIntent.SCHEME_SEARCH]
    assert len(response.eligibility_results) > 0
    assert response.eligibility_results[0]["status"] == "ELIGIBLE"

@pytest.mark.asyncio
async def test_case_3_eligibility_unknown_missing_info(db_session):
    # Scheme requires age and annual_income
    scheme = Scheme(
        name="TEST INCOME SCHEME",
        slug="test-income-scheme",
        short_description="Test scheme requiring income",
        government_level=GovernmentLevel.STATE,
        scheme_type=SchemeType.SUBSIDY,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    grp = EligibilityRuleGroup(scheme_id=scheme.id, logical_operator="AND")
    db_session.add(grp)
    db_session.commit()

    rule1 = EligibilityRule(group_id=grp.id, parameter_name="annual_income", operator=RuleOperator.LESS_THAN_OR_EQUAL, comparison_value=250000)
    db_session.add(rule1)
    db_session.commit()

    # Profile missing annual_income
    profile = {"age": 20}

    response = await AIOrchestrator.process_user_query(
        db=db_session,
        query="Am I eligible for the income scheme?",
        override_profile=profile
    )

    assert len(response.eligibility_results) > 0
    assert response.eligibility_results[0]["status"] == "UNKNOWN"
    assert "annual_income" in response.eligibility_results[0]["missing_information"]

@pytest.mark.asyncio
async def test_case_4_eligibility_not_eligible_failed_condition(db_session):
    scheme = Scheme(
        name="TEST STRICT AGE SCHEME",
        slug="test-strict-age-scheme",
        short_description="Test scheme for age requirement",
        government_level=GovernmentLevel.CENTRAL,
        scheme_type=SchemeType.SCHOLARSHIP,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    grp = EligibilityRuleGroup(scheme_id=scheme.id, logical_operator="AND")
    db_session.add(grp)
    db_session.commit()

    rule1 = EligibilityRule(group_id=grp.id, parameter_name="age", operator=RuleOperator.GREATER_THAN_OR_EQUAL, comparison_value=18)
    db_session.add(rule1)
    db_session.commit()

    # User age 16 fails requirement age >= 18
    profile = {"age": 16}

    response = await AIOrchestrator.process_user_query(
        db=db_session,
        query="Why am I not eligible?",
        override_profile=profile
    )

    assert len(response.eligibility_results) > 0
    assert response.eligibility_results[0]["status"] == "NOT_ELIGIBLE"
    assert len(response.eligibility_results[0]["failed_conditions"]) > 0

@pytest.mark.asyncio
async def test_case_5_document_query(db_session):
    scheme = Scheme(
        name="SCHEME WITH DOCUMENTS",
        slug="scheme-with-documents",
        short_description="Test scheme for document query",
        government_level=GovernmentLevel.CENTRAL,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    doc = Document(name="Aadhaar Card", description="Identity proof", document_type=DocumentType.IDENTITY_PROOF)
    db_session.add(doc)
    db_session.commit()

    sdoc = SchemeDocument(scheme_id=scheme.id, document_id=doc.id, mandatory=True)
    db_session.add(sdoc)
    db_session.commit()

    response = await AIOrchestrator.process_user_query(
        db=db_session,
        query="What documents do I need for SCHEME WITH DOCUMENTS?"
    )

    assert response.intent == AssistantIntent.DOCUMENT_QUERY
    assert len(response.schemes) > 0

@pytest.mark.asyncio
async def test_case_6_application_process_query(db_session):
    scheme = Scheme(
        name="SCHEME WITH APPLICATION PROCESS",
        slug="scheme-with-application-process",
        short_description="Test scheme for application process",
        government_level=GovernmentLevel.STATE,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    ap = ApplicationProcess(scheme_id=scheme.id, application_mode="ONLINE", official_application_url="https://scholarships.gov.in")
    db_session.add(ap)
    db_session.commit()

    step1 = ApplicationStep(process_id=ap.id, step_number=1, title="Register Account", instructions="Register on official portal")
    db_session.add(step1)
    db_session.commit()

    response = await AIOrchestrator.process_user_query(
        db=db_session,
        query="How do I apply for SCHEME WITH APPLICATION PROCESS?"
    )

    assert response.intent == AssistantIntent.APPLICATION_GUIDANCE
    assert len(response.schemes) > 0

@pytest.mark.asyncio
async def test_case_7_only_published_schemes_returned(db_session):
    # Draft scheme should never be returned by retriever
    draft_scheme = Scheme(
        name="INTERNAL DRAFT SCHEME DO NOT SHOW",
        slug="internal-draft-scheme",
        short_description="Draft scheme",
        government_level=GovernmentLevel.CENTRAL,
        status=SchemeStatus.DRAFT
    )
    db_session.add(draft_scheme)
    db_session.commit()

    response = await AIOrchestrator.process_user_query(
        db=db_session,
        query="INTERNAL DRAFT SCHEME"
    )

    # Verify draft scheme is not exposed in schemes or eligibility_results
    exposed_ids = [s.get("id") for s in response.schemes] + [e.get("scheme_id") for e in response.eligibility_results]
    assert draft_scheme.id not in exposed_ids

def test_assistant_rest_api_endpoint(db_session):
    res = client.post("/api/v1/assistant/query", json={
        "query": "What schemes are available for students?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "message" in data
    assert "intent" in data
    assert "conversation_id" in data
