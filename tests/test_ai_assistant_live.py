import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.models import (
    Scheme, EligibilityRuleGroup, EligibilityRule, 
    Document, SchemeDocument, ApplicationProcess, 
    SchemeSource, OfficialSource
)
from app.enums import GovernmentLevel, SchemeType, SchemeStatus, RuleOperator, DocumentType
from app.ai.orchestrator import AIOrchestrator
from app.schemas.ai import AssistantIntent, AssistantQueryRequest
from app.api.v1.endpoints.assistant import query_assistant, get_assistant_status
from database.seeds.maharashtra_schemes import seed_maharashtra_knowledge_base

def run_sync(coro):
    """Synchronous runner avoiding Python 3.14 Windows ProactorEventLoop deadlock."""
    while True:
        try:
            coro.send(None)
        except StopIteration as e:
            return e.value

@pytest.fixture(autouse=True)
def seed_test_database(db_session):
    seed_maharashtra_knowledge_base(db_session)

def test_assistant_suggested_query_1_scholarships(db_session):
    """Test Suggested Query: 'Find scholarships'"""
    res = run_sync(AIOrchestrator.process_user_query(
        db=db_session,
        query="Find scholarships"
    ))
    assert res.intent in [AssistantIntent.SCHEME_SEARCH, AssistantIntent.GENERAL_GOVERNMENT_SCHEME_QUERY]
    assert len(res.message) > 0
    # Must mention verified scholarships
    assert any(term in res.message.lower() for term in ["scholarship", "shahu maharaj", "ebc", "mahadbt"])

def test_assistant_suggested_query_2_farmers(db_session):
    """Test Suggested Query: 'Schemes for farmers'"""
    res = run_sync(AIOrchestrator.process_user_query(
        db=db_session,
        query="Schemes for farmers"
    ))
    assert res.intent in [AssistantIntent.SCHEME_SEARCH, AssistantIntent.GENERAL_GOVERNMENT_SCHEME_QUERY]
    assert len(res.message) > 0
    assert any(term in res.message.lower() for term in ["namo shetkari", "pm-kisan", "farmer", "krishi"])

def test_assistant_suggested_query_3_entrepreneurs(db_session):
    """Test Suggested Query: 'Schemes for entrepreneurs'"""
    res = run_sync(AIOrchestrator.process_user_query(
        db=db_session,
        query="Schemes for entrepreneurs"
    ))
    assert res.intent in [AssistantIntent.SCHEME_SEARCH, AssistantIntent.GENERAL_GOVERNMENT_SCHEME_QUERY]
    assert len(res.message) > 0
    assert any(term in res.message.lower() for term in ["cmegp", "pmegp", "mudra", "entrepreneur", "msme"])

def test_assistant_suggested_query_4_eligibility(db_session):
    """Test Suggested Query: 'Check my eligibility'"""
    # 4a: Without profile -> guidance on parameters or clarification prompt
    res_no_profile = run_sync(AIOrchestrator.process_user_query(
        db=db_session,
        query="Check my eligibility"
    ))
    assert res_no_profile.intent == AssistantIntent.ELIGIBILITY_CHECK
    assert len(res_no_profile.message) > 0

    # 4b: With profile -> deterministic Phase 3 evaluation
    res_with_profile = run_sync(AIOrchestrator.process_user_query(
        db=db_session,
        query="Am I eligible for EBC scholarship as a 20 year old student with 200000 income in Maharashtra?",
        override_profile={"age": 20, "annual_income": 200000, "state_code": "IN-MH", "occupation_type": "STUDENT"}
    ))
    assert len(res_with_profile.message) > 0

def test_assistant_suggested_query_5_documents(db_session):
    """Test Suggested Query: 'What documents do I need?'"""
    res = run_sync(AIOrchestrator.process_user_query(
        db=db_session,
        query="What documents do I need?"
    ))
    assert res.intent == AssistantIntent.DOCUMENT_QUERY
    assert any(term in res.message.lower() for term in ["aadhaar", "domicile", "income", "document"])

def test_assistant_chat_endpoint_router(db_session):
    """Test both POST /chat and POST /query router handlers directly"""
    req = AssistantQueryRequest(query="Find scholarships for Maharashtra students")
    resp = run_sync(query_assistant(req=req, db=db_session))
    assert resp.conversation_id is not None
    assert len(resp.message) > 0
    assert resp.provider_info is not None

def test_assistant_status_endpoint():
    """Test GET /assistant/status endpoint"""
    status_info = get_assistant_status()
    assert "provider" in status_info
    assert "model" in status_info
    assert "status" in status_info
