import sys
import os
import pytest
from datetime import datetime
from fastapi import HTTPException, UploadFile
import io

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
backend_dir = os.path.join(root_dir, 'backend')
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.models.user import User
from app.models.scheme import Scheme
from app.models.application_tracking import CitizenApplication, ApplicationStatusHistory, ApplicationDocument
from app.enums import UserRole, CitizenApplicationStatus
from app.schemas.citizen_application import (
    CitizenApplicationCreate, CitizenApplicationUpdate, CitizenApplicationStatusUpdate
)
from app.api.v1.endpoints.citizen_applications import (
    create_citizen_application, list_citizen_applications, get_citizen_application,
    update_citizen_application, update_application_status, get_applications_summary,
    get_application_history, upload_application_document, delete_application_document
)
from database.seeds.maharashtra_schemes import seed_maharashtra_knowledge_base

@pytest.fixture(autouse=True)
def seed_test_database(db_session):
    seed_maharashtra_knowledge_base(db_session)

@pytest.fixture
def citizen_user_a(db_session):
    user = User(
        id="citizen-user-a-uuid",
        email="citizen.a@example.com",
        role=UserRole.CITIZEN.value,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def citizen_user_b(db_session):
    user = User(
        id="citizen-user-b-uuid",
        email="citizen.b@example.com",
        role=UserRole.CITIZEN.value,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def admin_user(db_session):
    user = User(
        id="admin-user-uuid",
        email="admin@maharashtra.gov.in",
        role=UserRole.ADMIN.value,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def sample_scheme(db_session):
    scheme = db_session.query(Scheme).first()
    assert scheme is not None
    return scheme

def test_create_citizen_application_success(db_session, citizen_user_a, sample_scheme):
    """Citizen creates an application with valid reference number and scheme."""
    payload = CitizenApplicationCreate(
        scheme_id=sample_scheme.id,
        application_reference="MH-SCH-2026-001A",
        application_type="FRESH",
        application_date=datetime(2026, 9, 1),
        status=CitizenApplicationStatus.SUBMITTED,
        department="Higher Education Department",
        portal_url="https://mahadbt.maharashtra.gov.in/",
        notes="Submitted at regional scrutiny centre."
    )

    created = create_citizen_application(data=payload, current_user=citizen_user_a, db=db_session)
    assert created.id is not None
    assert created.application_reference == "MH-SCH-2026-001A"
    assert created.user_id == citizen_user_a.id
    assert created.status == CitizenApplicationStatus.SUBMITTED
    assert created.progress_step == 1
    assert created.scheme_name == sample_scheme.name

    # Check status history was logged
    history = db_session.query(ApplicationStatusHistory).filter(
        ApplicationStatusHistory.application_id == created.id
    ).all()
    assert len(history) == 1
    assert history[0].new_status == "SUBMITTED"
    assert history[0].source == "CITIZEN_MANUAL"

def test_create_application_duplicate_reference_rejected(db_session, citizen_user_a, sample_scheme):
    """Duplicate reference number for the same citizen is rejected with 409 Conflict."""
    payload = CitizenApplicationCreate(
        scheme_id=sample_scheme.id,
        application_reference="MH-DUP-REF-100",
        application_type="FRESH"
    )
    create_citizen_application(data=payload, current_user=citizen_user_a, db=db_session)

    # Second attempt with same ref
    with pytest.raises(HTTPException) as exc_info:
        create_citizen_application(data=payload, current_user=citizen_user_a, db=db_session)
    assert exc_info.value.status_code == 409
    assert "already being tracked" in exc_info.value.detail

def test_create_application_invalid_scheme_rejected(db_session, citizen_user_a):
    """Non-existent scheme ID returns 404."""
    payload = CitizenApplicationCreate(
        scheme_id="invalid-scheme-uuid-9999",
        application_reference="MH-ERR-001"
    )
    with pytest.raises(HTTPException) as exc_info:
        create_citizen_application(data=payload, current_user=citizen_user_a, db=db_session)
    assert exc_info.value.status_code == 404

def test_list_applications_and_idor_protection(db_session, citizen_user_a, citizen_user_b, admin_user, sample_scheme):
    """Ensure Citizen A cannot see Citizen B's applications, but Admin can see all."""
    # User A creates 2 applications
    create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="USERA-REF-01"),
        current_user=citizen_user_a, db=db_session
    )
    create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="USERA-REF-02"),
        current_user=citizen_user_a, db=db_session
    )

    # User B creates 1 application
    create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="USERB-REF-01"),
        current_user=citizen_user_b, db=db_session
    )

    # User A listing
    list_a = list_citizen_applications(current_user=citizen_user_a, db=db_session)
    assert len(list_a) == 2
    refs_a = [app.application_reference for app in list_a]
    assert "USERA-REF-01" in refs_a
    assert "USERB-REF-01" not in refs_a  # IDOR check passed

    # User B listing
    list_b = list_citizen_applications(current_user=citizen_user_b, db=db_session)
    assert len(list_b) == 1
    assert list_b[0].application_reference == "USERB-REF-01"

    # Admin listing
    list_admin = list_citizen_applications(current_user=admin_user, db=db_session)
    assert len(list_admin) == 3

def test_get_application_by_id_idor_blocked(db_session, citizen_user_a, citizen_user_b, sample_scheme):
    """Citizen B accessing Citizen A's application by ID raises 403 Forbidden."""
    created = create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="PRIVATE-APP-001"),
        current_user=citizen_user_a, db=db_session
    )

    # User B tries to get it
    with pytest.raises(HTTPException) as exc_info:
        get_citizen_application(id=created.id, current_user=citizen_user_b, db=db_session)
    assert exc_info.value.status_code == 403

def test_update_application_status_and_history(db_session, citizen_user_a, sample_scheme):
    """Status updates create history timeline records with step progression."""
    created = create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="APP-PROG-001"),
        current_user=citizen_user_a, db=db_session
    )
    assert created.progress_step == 1

    # Update to DOCUMENTS_VERIFICATION
    updated_1 = update_citizen_application(
        id=created.id,
        data=CitizenApplicationUpdate(
            new_status=CitizenApplicationStatus.DOCUMENTS_VERIFICATION,
            status_update_title="Aadhaar e-KYC Verified",
            notes="Biometric verification confirmed at portal."
        ),
        current_user=citizen_user_a, db=db_session
    )
    assert updated_1.status == CitizenApplicationStatus.DOCUMENTS_VERIFICATION
    assert updated_1.progress_step == 2

    # Update to UNDER_REVIEW
    updated_2 = update_citizen_application(
        id=created.id,
        data=CitizenApplicationUpdate(
            new_status=CitizenApplicationStatus.UNDER_REVIEW,
            status_update_title="Forwarded to District Welfare Officer"
        ),
        current_user=citizen_user_a, db=db_session
    )
    assert updated_2.status == CitizenApplicationStatus.UNDER_REVIEW
    assert updated_2.progress_step == 3

    # Update to APPROVED
    updated_3 = update_citizen_application(
        id=created.id,
        data=CitizenApplicationUpdate(
            new_status=CitizenApplicationStatus.APPROVED,
            status_update_title="Sanction Order Issued"
        ),
        current_user=citizen_user_a, db=db_session
    )
    assert updated_3.status == CitizenApplicationStatus.APPROVED
    assert updated_3.progress_step == 4

    # Verify history timeline length
    history = get_application_history(id=created.id, current_user=citizen_user_a, db=db_session)
    assert len(history) == 4  # Initial + 3 updates
    assert history[0].new_status == "APPROVED"
    assert history[1].new_status == "UNDER_REVIEW"

def test_application_action_required_and_rejection_states(db_session, citizen_user_a, sample_scheme):
    """Test ADDITIONAL_INFO_REQUIRED and REJECTED states with specific explanations."""
    created = create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="APP-REJ-001"),
        current_user=citizen_user_a, db=db_session
    )

    # 1. Action required
    updated_action = update_citizen_application(
        id=created.id,
        data=CitizenApplicationUpdate(
            new_status=CitizenApplicationStatus.ADDITIONAL_INFO_REQUIRED,
            action_required_details="Upload domicile certificate signed by Executive Magistrate.",
            status_update_title="Additional Document Required"
        ),
        current_user=citizen_user_a, db=db_session
    )
    assert updated_action.status == CitizenApplicationStatus.ADDITIONAL_INFO_REQUIRED
    assert updated_action.action_required_details == "Upload domicile certificate signed by Executive Magistrate."

    # 2. Rejection
    updated_rej = update_citizen_application(
        id=created.id,
        data=CitizenApplicationUpdate(
            new_status=CitizenApplicationStatus.REJECTED,
            rejection_reason="Annual family income exceeds ceiling of ₹2,50,000.",
            status_update_title="Application Rejected by Department"
        ),
        current_user=citizen_user_a, db=db_session
    )
    assert updated_rej.status == CitizenApplicationStatus.REJECTED
    assert updated_rej.rejection_reason == "Annual family income exceeds ceiling of ₹2,50,000."
    assert updated_rej.progress_step == 4

def test_application_summary_metrics(db_session, citizen_user_a, sample_scheme):
    """Verify summary counts match database records accurately."""
    # Create 1 Submitted (Under process)
    create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="SUMM-01", status=CitizenApplicationStatus.SUBMITTED),
        current_user=citizen_user_a, db=db_session
    )
    # Create 1 Under Review (Under process)
    create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="SUMM-02", status=CitizenApplicationStatus.UNDER_REVIEW),
        current_user=citizen_user_a, db=db_session
    )
    # Create 1 Approved
    create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="SUMM-03", status=CitizenApplicationStatus.APPROVED),
        current_user=citizen_user_a, db=db_session
    )
    # Create 1 Action Required
    create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="SUMM-04", status=CitizenApplicationStatus.ADDITIONAL_INFO_REQUIRED),
        current_user=citizen_user_a, db=db_session
    )
    # Create 1 Rejected
    create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="SUMM-05", status=CitizenApplicationStatus.REJECTED),
        current_user=citizen_user_a, db=db_session
    )

    summary = get_applications_summary(current_user=citizen_user_a, db=db_session)
    assert summary.total_applications == 5
    assert summary.under_process == 2  # SUBMITTED + UNDER_REVIEW
    assert summary.approved == 1       # APPROVED
    assert summary.action_required == 1  # ADDITIONAL_INFO_REQUIRED
    assert summary.rejected == 1       # REJECTED

def test_application_document_upload_and_idor_protection(db_session, citizen_user_a, citizen_user_b, sample_scheme):
    """Uploading documents saves file, enforces file type validation, and protects against unauthorized deletion."""
    import asyncio

    created = create_citizen_application(
        data=CitizenApplicationCreate(scheme_id=sample_scheme.id, application_reference="APP-DOCS-01"),
        current_user=citizen_user_a, db=db_session
    )

    # Valid PDF upload
    file_content = b"%PDF-1.4 Mock receipt content for testing"
    mock_file = UploadFile(
        file=io.BytesIO(file_content),
        filename="acknowledgement_receipt.pdf",
        headers={"content-type": "application/pdf"}
    )

    doc_resp = upload_application_document(
        id=created.id,
        file=mock_file,
        document_type="ACKNOWLEDGEMENT",
        document_name="MahaDBT Receipt 2026",
        current_user=citizen_user_a,
        db=db_session
    )
    assert doc_resp.id is not None
    assert doc_resp.document_name == "MahaDBT Receipt 2026"
    assert doc_resp.document_type == "ACKNOWLEDGEMENT"

    # User B tries to delete User A's document -> Forbidden
    with pytest.raises(HTTPException) as exc_info:
        delete_application_document(id=created.id, doc_id=doc_resp.id, current_user=citizen_user_b, db=db_session)
    assert exc_info.value.status_code == 403

    # User A deletes their own document -> Success
    res = delete_application_document(id=created.id, doc_id=doc_resp.id, current_user=citizen_user_a, db=db_session)
    assert res is None
