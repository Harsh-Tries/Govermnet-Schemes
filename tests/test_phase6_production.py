import os
import pytest
from app.models import Scheme
from app.enums import GovernmentLevel, SchemeType, SchemeStatus, UserRole, NotificationCategory
from app.services.verification.change_detector import SchemeChangeDetectorService
from app.services.integrations.mock_adapter import MockGovernmentAdapter
from app.services.personalization.recommendation_engine import PersonalizedRecommendationEngine
from app.services.notifications.service import NotificationService
from app.core.rbac import require_roles
from app.core.cache import CacheService
from app.services.ai_eval.evaluator import AIQualityEvaluator

def test_scheme_versioning_and_change_detection(db_session):
    scheme = Scheme(
        name="VERSION TEST SCHEME",
        slug="version-test-scheme",
        short_description="Scheme for testing version snapshots",
        government_level=GovernmentLevel.CENTRAL,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    # Create Version Snapshot
    ver1 = SchemeChangeDetectorService.create_version_snapshot(db_session, scheme.id, change_summary="Initial version")
    assert ver1.version_number == 1

    # Detect parameter change
    diff = SchemeChangeDetectorService.detect_parameter_change(
        db_session,
        scheme_id=scheme.id,
        parameter_name="annual_income",
        old_val="200000",
        new_val="300000"
    )
    assert diff["status"] == SchemeStatus.CHANGE_DETECTED.value
    assert diff["requires_review"] is True

    # Approve & Create Version 2
    ver2 = SchemeChangeDetectorService.create_version_snapshot(db_session, scheme.id, change_summary="Updated income threshold")
    assert ver2.version_number == 2

def test_mock_government_adapter_sync():
    adapter = MockGovernmentAdapter(integration_id="mock-1", base_url="https://scholarships.gov.in")
    status_info = adapter.get_application_status("REF-APP-2026-99")
    assert status_info["status"] == "DOCUMENTS_VERIFIED"
    assert status_info["verified_by_official"] is True

    sub_info = adapter.submit_application({"scheme_id": "scheme-101"})
    assert sub_info["success"] is True
    assert "NSP-GOV" in sub_info["application_reference"]

def test_personalized_recommendation_engine(db_session):
    scheme = Scheme(
        name="PERSONALIZATION TEST SCHEME",
        slug="personalization-test-scheme",
        short_description="Scholarship scheme for OBC students",
        government_level=GovernmentLevel.CENTRAL,
        scheme_type=SchemeType.SCHOLARSHIP,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    profile = {
        "state": "Maharashtra",
        "category": "OBC",
        "profession": "STUDENT",
        "income": 150000,
        "age": 20
    }

    recs = PersonalizedRecommendationEngine.get_personalized_recommendations(db_session, profile, limit=5)
    assert len(recs) > 0
    top_rec = recs[0]
    assert "explanation_factors" in top_rec
    assert len(top_rec["explanation_factors"]) > 0

def test_notification_dispatch_and_read(db_session):
    notif = NotificationService.send_notification(
        db_session,
        user_id="user-777",
        category=NotificationCategory.DEADLINES,
        title="Deadline Reminder",
        message="Scheme deadline in 3 days."
    )
    assert notif.id is not None
    assert notif.is_read is False

    read_notif = NotificationService.mark_as_read(db_session, notif.id)
    assert read_notif.is_read is True

def test_rbac_authorization():
    checker = require_roles([UserRole.ADMIN, UserRole.CONTENT_ADMIN])
    assert checker("ADMIN") == UserRole.ADMIN
    assert checker("CONTENT_ADMIN") == UserRole.CONTENT_ADMIN

    with pytest.raises(Exception):
        checker("CITIZEN")

def test_cache_service():
    CacheService.set("test_key", "hello_phase6", ttl_seconds=10)
    assert CacheService.get("test_key") == "hello_phase6"
    CacheService.clear()
    assert CacheService.get("test_key") is None

@pytest.mark.asyncio
async def test_ai_quality_evaluator_benchmark(db_session):
    benchmark_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "data/ai_eval_benchmark.json"))
    res = await AIQualityEvaluator.evaluate_benchmark_dataset(db_session, benchmark_file)
    assert "intent_accuracy" in res
    assert "retrieval_recall" in res
    assert res["intent_accuracy"] >= 0.0
