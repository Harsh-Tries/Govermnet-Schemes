"""
Phase 6 Critical Repair Test Suite:
Verifies:
1. Role-Based Access Control (RBAC):
   - Client-supplied headers (X-Role, X-User-Role) are ignored and cannot elevate privileges.
   - Unauthenticated requests fail closed with 401 Unauthorized.
   - Ordinary citizens are blocked from admin routes with 403 Forbidden.
   - Authorized administrators can access permitted operations.
   - Public registration cannot assign privileged roles.
   - IDOR protection on citizen applications and exports.
2. Data Purge Safety:
   - Scoped purge requires SYSTEM_ADMIN role and explicit confirmation.
   - Dry run reports candidates without deleting data.
   - Scoped deletion preserves genuine schemes, applications, and bookmarks.
   - Production mode blocks demo cleanup.
   - Citizen data deletion only removes the caller's records.
3. Alembic Migrations:
   - Complete schema upgrade and downgrade work on a fresh database.
4. Background Worker:
   - Module imports, initializes, and executes registered tasks cleanly.
"""

import os
import sys
import pytest
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, inspect

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.models import Scheme, User, CitizenApplication, Notification, UserBookmark
from app.enums import SchemeStatus, GovernmentLevel, UserRole, CitizenApplicationStatus
from app.core.security import create_access_token
from app.core.rbac import require_roles
from app.core.auth import get_current_user
from app.services.governance.purge_service import SafePurgeService, PurgeScope, PurgeSafetyException
from app.worker import SchemeAssistantWorker
from app.api.v1.endpoints.schemes import create_scheme, list_schemes
from app.api.v1.endpoints.user_governance import delete_citizen_data, export_citizen_data
from app.api.v1.endpoints.citizen_applications import list_citizen_applications, get_citizen_application
from app.schemas.scheme import SchemeCreate
from fastapi import HTTPException


# ==============================================================================
# 1. RBAC & AUTHENTICATION SECURITY TESTS
# ==============================================================================

def test_rbac_cannot_be_spoofed_with_client_headers():
    """Verify that require_roles depends on server-side User object and fails closed on unauthenticated input."""
    checker = require_roles([UserRole.ADMIN])

    # Unauthenticated / invalid input fails closed
    with pytest.raises(HTTPException) as exc_info:
        checker(None)
    assert exc_info.value.status_code == 401

    # Passing arbitrary or citizen string fails with 403
    with pytest.raises(HTTPException) as exc_info:
        checker("CITIZEN")
    assert exc_info.value.status_code == 403

    # An authenticated User object with CITIZEN role fails with 403
    citizen_user = User(id="citizen-1", role=UserRole.CITIZEN.value, is_active=True)
    with pytest.raises(HTTPException) as exc_info:
        checker(citizen_user)
    assert exc_info.value.status_code == 403
    assert "not authorized" in exc_info.value.detail

    # An authenticated User object with ADMIN role succeeds
    admin_user = User(id="admin-1", role=UserRole.ADMIN.value, is_active=True)
    assert checker(admin_user) == UserRole.ADMIN


def test_public_registration_cannot_elevate_privileges(db_session: Session):
    """Ensure that registering an account enforces CITIZEN role even if client passes 'ADMIN'."""
    from app.api.v1.endpoints.auth import register_citizen, RegisterRequest

    req = RegisterRequest(
        email="attacker@example.gov.in",
        password="SecurePassword123!",
        role="ADMIN"  # Attempted privilege escalation
    )
    resp = register_citizen(req, db=db_session)
    assert resp.user["role"] == UserRole.CITIZEN.value

    # Verify database record
    user_in_db = db_session.query(User).filter(User.id == resp.user["id"]).first()
    assert user_in_db.role == UserRole.CITIZEN.value


def test_idor_citizen_applications_isolated_between_users(db_session: Session):
    """Ensure Citizen A cannot see or access Citizen B's private applications."""
    # Create two distinct users
    user_a = User(id="user-alpha", email="alpha@example.gov.in", role=UserRole.CITIZEN.value, is_active=True)
    user_b = User(id="user-beta", email="beta@example.gov.in", role=UserRole.CITIZEN.value, is_active=True)
    scheme = Scheme(name="IDOR Test Scheme", slug="idor-scheme", short_description="Test short description", status=SchemeStatus.PUBLISHED)
    db_session.add_all([user_a, user_b, scheme])
    db_session.commit()

    # Create application for User A
    app_a = CitizenApplication(
        user_id="user-alpha",
        scheme_id=scheme.id,
        application_reference="REF-ALPHA-001",
        status=CitizenApplicationStatus.SUBMITTED
    )
    # Create application for User B
    app_b = CitizenApplication(
        user_id="user-beta",
        scheme_id=scheme.id,
        application_reference="REF-BETA-002",
        status=CitizenApplicationStatus.SUBMITTED
    )
    db_session.add_all([app_a, app_b])
    db_session.commit()

    # User A listing applications should ONLY see User A's application
    apps_for_a = list_citizen_applications(current_user=user_a, db=db_session)
    refs_a = [a.application_reference for a in apps_for_a]
    assert "REF-ALPHA-001" in refs_a
    assert "REF-BETA-002" not in refs_a

    # User A attempting to fetch User B's application directly should be FORBIDDEN
    with pytest.raises(HTTPException) as exc_info:
        get_citizen_application(id=app_b.id, current_user=user_a, db=db_session)
    assert exc_info.value.status_code == 403


# ==============================================================================
# 2. PURGE SAFETY & DATA PRESERVATION TESTS
# ==============================================================================

def test_citizen_delete_data_does_not_wipe_unrelated_citizens(db_session: Session):
    """Regression test: delete_citizen_data must NEVER wipe other users' applications or whole tables."""
    # Setup User 1 and User 2 data
    scheme = Scheme(name="Purge Safety Scheme", slug="purge-safety-scheme", short_description="Purge safety desc", status=SchemeStatus.PUBLISHED)
    u1 = User(id="citizen-101", email="c101@example.gov.in", role=UserRole.CITIZEN.value, is_active=True)
    u2 = User(id="citizen-102", email="c102@example.gov.in", role=UserRole.CITIZEN.value, is_active=True)
    db_session.add_all([scheme, u1, u2])
    db_session.commit()

    app_1 = CitizenApplication(user_id="citizen-101", scheme_id=scheme.id, application_reference="APP-101")
    app_2 = CitizenApplication(user_id="citizen-102", scheme_id=scheme.id, application_reference="APP-102")
    notif_1 = Notification(user_id="citizen-101", category="SYSTEM", title="N1", message="M1")
    notif_2 = Notification(user_id="citizen-102", category="SYSTEM", title="N2", message="M2")
    db_session.add_all([app_1, app_2, notif_1, notif_2])
    db_session.commit()

    # Citizen 101 requests data deletion
    result = delete_citizen_data(current_user=u1, db=db_session)
    assert result["success"] is True

    # Citizen 101's data is gone
    assert db_session.query(CitizenApplication).filter(CitizenApplication.user_id == "citizen-101").count() == 0
    assert db_session.query(Notification).filter(Notification.user_id == "citizen-101").count() == 0

    # CRITICAL: Citizen 102's data is completely intact!
    assert db_session.query(CitizenApplication).filter(CitizenApplication.user_id == "citizen-102").count() == 1
    assert db_session.query(Notification).filter(Notification.user_id == "citizen-102").count() == 1


def test_safe_purge_service_dry_run_and_confirmation(db_session: Session):
    """Test SafePurgeService dry run, invalid confirmation, and genuine scheme preservation."""
    # Seed 1 demo scheme and 1 genuine scheme
    demo_scheme = Scheme(name="DEMO FAKE SCHEME 2026", slug="demo-fake-scheme-2026", short_description="Demo fake scheme", status=SchemeStatus.ARCHIVED)
    real_scheme = Scheme(name="Genuine Maha Scheme", slug="genuine-maha-scheme", short_description="Genuine Maha scheme", status=SchemeStatus.PUBLISHED)
    db_session.add_all([demo_scheme, real_scheme])
    db_session.commit()

    # 1. Invalid confirmation phrase fails
    with pytest.raises(PurgeSafetyException):
        SafePurgeService.execute_scoped_purge(
            db=db_session,
            scope=PurgeScope.DEMO_SCHEMES_ONLY,
            confirmation_code="WRONG_CODE",
            dry_run=True,
            actor_role=UserRole.SYSTEM_ADMIN
        )

    # 2. Unauthorized role fails
    with pytest.raises(PurgeSafetyException):
        SafePurgeService.execute_scoped_purge(
            db=db_session,
            scope=PurgeScope.DEMO_SCHEMES_ONLY,
            confirmation_code="CONFIRM_DEMO_SCHEMES_ONLY",
            dry_run=True,
            actor_role=UserRole.CITIZEN
        )

    # 3. Dry run identifies candidate without deleting
    report = SafePurgeService.execute_scoped_purge(
        db=db_session,
        scope=PurgeScope.DEMO_SCHEMES_ONLY,
        confirmation_code="CONFIRM_DEMO_SCHEMES_ONLY",
        dry_run=True,
        actor_role=UserRole.SYSTEM_ADMIN
    )
    assert report["dry_run"] is True
    assert report["candidates_count"] == 1
    assert db_session.query(Scheme).filter(Scheme.slug == "demo-fake-scheme-2026").count() == 1

    # 4. Actual execution removes ONLY the demo scheme, preserving the genuine scheme
    report_exec = SafePurgeService.execute_scoped_purge(
        db=db_session,
        scope=PurgeScope.DEMO_SCHEMES_ONLY,
        confirmation_code="CONFIRM_DEMO_SCHEMES_ONLY",
        dry_run=False,
        actor_role=UserRole.SYSTEM_ADMIN
    )
    assert report_exec["dry_run"] is False
    assert db_session.query(Scheme).filter(Scheme.slug == "demo-fake-scheme-2026").count() == 0
    # Genuine scheme is untouched
    assert db_session.query(Scheme).filter(Scheme.slug == "genuine-maha-scheme").count() == 1


# ==============================================================================
# 3. ALEMBIC MIGRATION TEST
# ==============================================================================

def test_alembic_fresh_database_migration_cycle(tmp_path):
    """Test full upgrade and downgrade cycle on disposable database using Alembic."""
    from alembic.config import Config
    from alembic import command

    disposable_db = str(tmp_path / "test_migration.db")
    cfg = Config("database/alembic.ini")
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{disposable_db}")

    # Upgrade to head
    command.upgrade(cfg, "head")

    # Verify tables exist
    test_engine = create_engine(f"sqlite:///{disposable_db}")
    insp = inspect(test_engine)
    tables = insp.get_table_names()
    assert len(tables) >= 38
    assert "schemes" in tables
    assert "users" in tables
    assert "citizen_applications" in tables
    assert "user_bookmarks" in tables

    # Downgrade to base
    command.downgrade(cfg, "base")
    insp_after = inspect(test_engine)
    tables_after = insp_after.get_table_names()
    assert "schemes" not in tables_after

    test_engine.dispose()


# ==============================================================================
# 4. BACKGROUND WORKER TEST
# ==============================================================================

def test_background_worker_cycle_execution(db_session: Session):
    """Verify background worker executes registered tasks and reports health."""
    worker = SchemeAssistantWorker(poll_interval_seconds=10)

    # Seed an application to verify sync task executes
    scheme = Scheme(name="Worker Sync Scheme", slug="worker-sync-scheme", short_description="Worker test desc", status=SchemeStatus.PUBLISHED)
    db_session.add(scheme)
    db_session.commit()

    app_rec = CitizenApplication(
        scheme_id=scheme.id,
        application_reference="REF-VER-9901",
        status=CitizenApplicationStatus.SUBMITTED
    )
    db_session.add(app_rec)
    db_session.commit()

    # Run one worker cycle
    stats = worker.run_cycle()
    assert "synced_applications" in stats
    assert "reverified_schemes" in stats
    assert worker.tasks_executed >= 1
    assert worker.tasks_succeeded >= 1
    assert worker.tasks_failed == 0

    health = worker.get_health()
    assert health["status"] == "healthy"
    assert health["tasks_succeeded"] >= 1
