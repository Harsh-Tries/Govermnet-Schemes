import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import Scheme
from app.enums import GovernmentLevel, SchemeType, SchemeStatus
from app.services.vector.chunker import SchemeChunkerService
from app.services.vector.vector_service import VectorSearchService
from app.services.vector.hybrid_retriever import HybridRetriever
from app.services.voice.providers.mock_stt_provider import MockSTTProvider
from app.services.analytics.service import AnalyticsService

@pytest.mark.asyncio
async def test_vector_chunking_and_embedding_indexing(db_session):
    scheme = Scheme(
        name="PHASE 5 VECTOR TEST SCHEME",
        slug="phase-5-vector-test-scheme",
        short_description="Vector chunking and embedding test scheme",
        government_level=GovernmentLevel.CENTRAL,
        scheme_type=SchemeType.SCHOLARSHIP,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    # Index embeddings
    await VectorSearchService.index_scheme_embeddings(db_session, scheme)

    # Perform vector search
    results = await VectorSearchService.search_vector_similarity(db_session, query="vector chunking test scholarship", limit=1)
    assert len(results) > 0
    chunk, score = results[0]
    assert chunk.scheme_id == scheme.id

@pytest.mark.asyncio
async def test_hybrid_search_retrieval(db_session):
    scheme = Scheme(
        name="HYBRID SEARCH TEST SCHEME",
        slug="hybrid-search-test-scheme",
        short_description="Hybrid keyword and vector semantic search scheme",
        government_level=GovernmentLevel.STATE,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    results = await HybridRetriever.hybrid_search(db_session, query="Hybrid keyword search", limit=5)
    assert len(results) > 0

@pytest.mark.asyncio
async def test_mock_stt_voice_provider():
    stt = MockSTTProvider()
    res_en = await stt.transcribe_audio(b"fakeaudio", language_hint="en")
    assert res_en.detected_language == "en"
    assert "scholarship" in res_en.text.lower()

    res_hi = await stt.transcribe_audio(b"fakeaudio", language_hint="hi")
    assert res_hi.detected_language == "hi"

def test_health_check_endpoints(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"

    res_live = client.get("/api/v1/health/live")
    assert res_live.status_code == 200
    assert res_live.json()["status"] == "LIVE"

    res_ready = client.get("/api/v1/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] in ["READY", "DEGRADED"]

def test_citizen_application_tracking_api(db_session, client):
    scheme = Scheme(
        name="APPLICATION TRACKING TEST SCHEME",
        slug="app-tracking-test-scheme",
        short_description="Scheme for citizen tracking test",
        government_level=GovernmentLevel.CENTRAL,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    # Create citizen application
    create_res = client.post("/api/v1/applications", json={
        "scheme_id": scheme.id,
        "application_reference": "REF-TEST-9988",
        "status": "SUBMITTED"
    })
    assert create_res.status_code == 201
    app_data = create_res.json()
    assert app_data["application_reference"] == "REF-TEST-9988"

    # Update status
    update_res = client.put(f"/api/v1/applications/{app_data['id']}/status", json={
        "new_status": "DOCUMENTS_VERIFIED",
        "notes": "Verified Aadhaar proof."
    })
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "DOCUMENTS_VERIFIED"
    assert len(update_res.json()["status_history"]) >= 2

def test_analytics_logging_and_dashboard_api(db_session, client):
    # Log event
    event = AnalyticsService.log_event(
        db_session, 
        event_name="ELIGIBILITY_CHECKED", 
        result_status="ELIGIBLE"
    )
    assert event.id is not None

    res_cit = client.get("/api/v1/analytics/citizen")
    assert res_cit.status_code == 200
    assert "schemes_viewed" in res_cit.json()

    res_admin = client.get("/api/v1/analytics/admin")
    assert res_admin.status_code == 200
    assert "missing_info_distribution" in res_admin.json()
