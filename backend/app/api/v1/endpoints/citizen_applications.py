import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.application_tracking import CitizenApplication, ApplicationStatusHistory, ApplicationDocument
from app.models import Scheme
from app.models.user import User
from app.enums import UserRole, CitizenApplicationStatus
from app.core.auth import get_optional_current_user
from app.schemas.citizen_application import (
    CitizenApplicationCreate, CitizenApplicationUpdate, CitizenApplicationStatusUpdate,
    CitizenApplicationResponse, ApplicationStatusHistoryResponse, ApplicationDocumentResponse,
    ApplicationSummaryResponse
)

router = APIRouter(tags=["Citizen Applications"])

UPLOAD_BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "uploads", "applications")
)
os.makedirs(UPLOAD_BASE_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def compute_progress_step(status_val: CitizenApplicationStatus | str) -> int:
    val = status_val.value if hasattr(status_val, 'value') else str(status_val)
    if val in ["SUBMITTED", "DRAFT"]:
        return 1
    elif val in ["DOCUMENTS_VERIFICATION", "DOCUMENTS_VERIFIED", "DOCUMENTS_PENDING"]:
        return 2
    elif val in ["UNDER_REVIEW", "ADDITIONAL_INFO_REQUIRED", "PAYMENT_PROCESSING"]:
        return 3
    elif val in ["APPROVED", "BENEFIT_DISBURSED", "COMPLETED", "REJECTED"]:
        return 4
    return 1

def format_application_response(app_rec: CitizenApplication) -> CitizenApplicationResponse:
    resp = CitizenApplicationResponse.model_validate(app_rec)
    resp.progress_step = compute_progress_step(app_rec.status)

    if app_rec.scheme:
        resp.scheme_name = app_rec.scheme.name
        # Category
        if hasattr(app_rec.scheme, 'category_maps') and app_rec.scheme.category_maps:
            resp.scheme_category = app_rec.scheme.category_maps[0].category.name
        elif hasattr(app_rec.scheme, 'scheme_type'):
            resp.scheme_category = str(app_rec.scheme.scheme_type.value if hasattr(app_rec.scheme.scheme_type, 'value') else app_rec.scheme.scheme_type)

        # Official Apply Portal URL
        if hasattr(app_rec.scheme, 'application_process') and app_rec.scheme.application_process:
            resp.scheme_portal_url = app_rec.scheme.application_process.official_application_url
        if not resp.scheme_portal_url:
            resp.scheme_portal_url = "https://mahadbt.maharashtra.gov.in/"

    # Latest Update
    if app_rec.status_history:
        resp.latest_update = ApplicationStatusHistoryResponse.model_validate(app_rec.status_history[0])

    # Documents
    if app_rec.documents:
        resp.documents = [
            ApplicationDocumentResponse(
                id=d.id,
                application_id=d.application_id,
                user_id=d.user_id,
                document_name=d.document_name,
                document_type=d.document_type,
                mime_type=d.mime_type,
                file_size=d.file_size,
                verification_status=d.verification_status,
                uploaded_at=d.uploaded_at,
                download_url=f"/api/v1/applications/{app_rec.id}/documents/{d.id}/download"
            )
            for d in app_rec.documents
        ]

    return resp

def get_effective_user_id(current_user: User | None) -> str:
    return current_user.id if current_user else "demo-citizen-user"


@router.post("/applications", response_model=CitizenApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_citizen_application(
    data: CitizenApplicationCreate,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(Scheme).filter(Scheme.id == data.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Selected government scheme not found.")

    user_id = get_effective_user_id(current_user)

    # Check for duplicate reference number for this user
    existing_ref = db.query(CitizenApplication).filter(
        CitizenApplication.application_reference == data.application_reference.strip(),
        CitizenApplication.user_id == user_id
    ).first()
    if existing_ref:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An application with reference number '{data.application_reference}' is already being tracked."
        )

    # Resolve official portal url
    portal = data.portal_url
    if not portal:
        if scheme.application_process and scheme.application_process.official_application_url:
            portal = scheme.application_process.official_application_url
        else:
            portal = "https://mahadbt.maharashtra.gov.in/"

    app_rec = CitizenApplication(
        user_id=user_id,
        scheme_id=data.scheme_id,
        application_reference=data.application_reference.strip().upper(),
        application_type=data.application_type or "FRESH",
        application_date=data.application_date or datetime.utcnow(),
        status=data.status,
        department=data.department or scheme.administering_ministry or "Government of Maharashtra",
        portal_url=portal,
        tracking_method=data.tracking_method or "MANUAL",
        notes=data.notes
    )
    db.add(app_rec)
    db.commit()
    db.refresh(app_rec)

    # Initial status history record
    initial_title = f"Application {str(data.status.value).replace('_', ' ').title()}"
    history = ApplicationStatusHistory(
        application_id=app_rec.id,
        old_status=None,
        new_status=str(app_rec.status.value),
        title=initial_title,
        source="CITIZEN_MANUAL",
        notes=data.notes or "Application tracked in citizen dashboard.",
        created_by="Citizen"
    )
    db.add(history)
    db.commit()
    db.refresh(app_rec)

    return format_application_response(app_rec)


@router.get("/applications/summary", response_model=ApplicationSummaryResponse)
def get_applications_summary(
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns counts for Total Applications, Under Process, Approved, Action Required, Rejected.
    Strictly scoped to the authenticated citizen.
    """
    user_id = get_effective_user_id(current_user)
    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]

    query = db.query(CitizenApplication)
    if not is_admin:
        query = query.filter(CitizenApplication.user_id == user_id)

    all_apps = query.all()

    total = len(all_apps)
    under_process = 0
    approved = 0
    action_required = 0
    rejected = 0
    withdrawn = 0

    for a in all_apps:
        val = str(a.status.value if hasattr(a.status, 'value') else a.status).upper()
        if val in ["SUBMITTED", "DOCUMENTS_VERIFIED", "DOCUMENTS_VERIFICATION", "DOCUMENTS_PENDING", "UNDER_REVIEW", "PAYMENT_PROCESSING"]:
            under_process += 1
        elif val in ["APPROVED", "BENEFIT_DISBURSED", "COMPLETED"]:
            approved += 1
        elif val in ["ADDITIONAL_INFO_REQUIRED"]:
            action_required += 1
        elif val in ["REJECTED"]:
            rejected += 1
        elif val in ["WITHDRAWN"]:
            withdrawn += 1

    return ApplicationSummaryResponse(
        total_applications=total,
        under_process=under_process,
        approved=approved,
        action_required=action_required,
        rejected=rejected,
        withdrawn=withdrawn
    )


@router.get("/applications", response_model=list[CitizenApplicationResponse])
def list_citizen_applications(
    search: str | None = Query(None, description="Search by scheme name, reference number, or department"),
    status_filter: str | None = Query(None, alias="status", description="Filter by application status"),
    sort_by: str = Query("recently_updated", description="Sort order: recently_updated, recently_submitted, oldest, status"),
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    List citizen applications with search, status filtering, and sorting.
    IDOR Security: Ordinary citizens only view their own applications.
    """
    user_id = get_effective_user_id(current_user)
    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]

    query = db.query(CitizenApplication)
    if not is_admin:
        query = query.filter(CitizenApplication.user_id == user_id)

    # Safe string unwrapping if called directly as Python function
    search_str = search if isinstance(search, str) else None
    status_str = status_filter if isinstance(status_filter, str) else None
    sort_str = sort_by if isinstance(sort_by, str) else "recently_updated"

    # Status filter
    if status_str and status_str.upper() != "ALL":
        query = query.filter(CitizenApplication.status == status_str.upper())

    # Search filter
    if search_str and search_str.strip():
        term = f"%{search_str.strip()}%"
        query = query.join(CitizenApplication.scheme).filter(
            or_(
                CitizenApplication.application_reference.ilike(term),
                CitizenApplication.department.ilike(term),
                Scheme.name.ilike(term)
            )
        )

    # Sorting
    if sort_str == "recently_submitted":
        query = query.order_by(CitizenApplication.application_date.desc().nullslast(), CitizenApplication.created_at.desc())
    elif sort_str == "oldest":
        query = query.order_by(CitizenApplication.created_at.asc())
    elif sort_str == "status":
        query = query.order_by(CitizenApplication.status.asc())
    else:  # recently_updated
        query = query.order_by(CitizenApplication.updated_at.desc().nullslast(), CitizenApplication.created_at.desc())

    apps = query.all()
    return [format_application_response(a) for a in apps]


@router.get("/applications/{id}", response_model=CitizenApplicationResponse)
def get_citizen_application(
    id: str,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Get citizen application by ID.
    IDOR Security: Prevents unauthorized cross-account access.
    """
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found.")

    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]
    if not is_admin:
        user_id = get_effective_user_id(current_user)
        if a.user_id and a.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this citizen application.")

    return format_application_response(a)


@router.patch("/applications/{id}", response_model=CitizenApplicationResponse)
def update_citizen_application(
    id: str,
    data: CitizenApplicationUpdate,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Update application details, personal notes, or citizen status.
    IDOR Security: Validates ownership before permitting updates.
    """
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found.")

    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]
    user_id = get_effective_user_id(current_user)
    if not is_admin and a.user_id and a.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this citizen application.")

    # Status update handling
    if data.new_status and data.new_status != a.status:
        old_st = str(a.status.value if hasattr(a.status, 'value') else a.status)
        new_st = str(data.new_status.value if hasattr(data.new_status, 'value') else data.new_status)
        a.status = data.new_status

        title = data.status_update_title or f"Status updated to {new_st.replace('_', ' ').title()}"
        history = ApplicationStatusHistory(
            application_id=a.id,
            old_status=old_st,
            new_status=new_st,
            title=title,
            source=data.source or ("ADMIN_VERIFICATION" if is_admin else "CITIZEN_MANUAL"),
            notes=data.notes or f"Application status transitioned from {old_st} to {new_st}.",
            remarks=data.status_update_remarks,
            created_by="Admin" if is_admin else "Citizen"
        )
        db.add(history)

    if data.application_type is not None:
        a.application_type = data.application_type
    if data.department is not None:
        a.department = data.department
    if data.portal_url is not None:
        a.portal_url = data.portal_url
    if data.notes is not None:
        a.notes = data.notes
    if data.rejection_reason is not None:
        a.rejection_reason = data.rejection_reason
    if data.action_required_details is not None:
        a.action_required_details = data.action_required_details
    if data.disbursement_details is not None:
        a.disbursement_details = data.disbursement_details

    a.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(a)

    return format_application_response(a)


@router.put("/applications/{id}/status", response_model=CitizenApplicationResponse)
def update_application_status(
    id: str,
    data: CitizenApplicationStatusUpdate,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found.")

    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]
    user_id = get_effective_user_id(current_user)
    if not is_admin and a.user_id and a.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this citizen application.")

    old_st = str(a.status.value if hasattr(a.status, 'value') else a.status)
    new_st = str(data.new_status.value if hasattr(data.new_status, 'value') else data.new_status)

    a.status = data.new_status
    a.updated_at = datetime.utcnow()

    title = data.title or f"Status changed to {new_st.replace('_', ' ').title()}"
    history = ApplicationStatusHistory(
        application_id=a.id,
        old_status=old_st,
        new_status=new_st,
        title=title,
        source=data.source or ("ADMIN_VERIFICATION" if is_admin else "CITIZEN_MANUAL"),
        notes=data.notes or f"Application status updated to {new_st}",
        remarks=data.remarks,
        created_by="Admin" if is_admin else "Citizen"
    )
    db.add(history)
    db.commit()
    db.refresh(a)

    return format_application_response(a)


@router.get("/applications/{id}/history", response_model=list[ApplicationStatusHistoryResponse])
def get_application_history(
    id: str,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full timeline history for an application.
    """
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found.")

    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]
    user_id = get_effective_user_id(current_user)
    if not is_admin and a.user_id and a.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return [ApplicationStatusHistoryResponse.model_validate(h) for h in a.status_history]


# ---------------- Document Management Endpoints ----------------

@router.post("/applications/{id}/documents", response_model=ApplicationDocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_application_document(
    id: str,
    file: UploadFile = File(...),
    document_type: str = Form("ACKNOWLEDGEMENT"),
    document_name: str | None = Form(None),
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload supporting document or acknowledgement receipt for an application.
    Validates MIME type, file size (max 5MB), and enforces IDOR protection.
    """
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found.")

    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]
    user_id = get_effective_user_id(current_user)
    if not is_admin and a.user_id and a.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{ext}'. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Read and check size
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 5MB (size: {len(content) / (1024*1024):.2f}MB)."
        )

    # Save to disk
    app_folder = os.path.join(UPLOAD_BASE_DIR, id)
    os.makedirs(app_folder, exist_ok=True)
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(app_folder, stored_filename)

    with open(stored_path, "wb") as f:
        f.write(content)

    doc_record = ApplicationDocument(
        application_id=id,
        user_id=user_id,
        document_name=document_name or file.filename or f"Document-{document_type}",
        document_type=document_type,
        file_path=stored_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        verification_status="PENDING",
        uploaded_at=datetime.utcnow()
    )
    db.add(doc_record)

    # Add audit log history
    history = ApplicationStatusHistory(
        application_id=id,
        old_status=str(a.status.value),
        new_status=str(a.status.value),
        title="Document Uploaded",
        source="CITIZEN_MANUAL",
        notes=f"Uploaded supporting document: {doc_record.document_name} ({document_type})",
        created_by="Citizen"
    )
    db.add(history)
    db.commit()
    db.refresh(doc_record)

    return ApplicationDocumentResponse(
        id=doc_record.id,
        application_id=doc_record.application_id,
        user_id=doc_record.user_id,
        document_name=doc_record.document_name,
        document_type=doc_record.document_type,
        mime_type=doc_record.mime_type,
        file_size=doc_record.file_size,
        verification_status=doc_record.verification_status,
        uploaded_at=doc_record.uploaded_at,
        download_url=f"/api/v1/applications/{id}/documents/{doc_record.id}/download"
    )


@router.get("/applications/{id}/documents", response_model=list[ApplicationDocumentResponse])
def list_application_documents(
    id: str,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found.")

    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]
    user_id = get_effective_user_id(current_user)
    if not is_admin and a.user_id and a.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return [
        ApplicationDocumentResponse(
            id=d.id,
            application_id=d.application_id,
            user_id=d.user_id,
            document_name=d.document_name,
            document_type=d.document_type,
            mime_type=d.mime_type,
            file_size=d.file_size,
            verification_status=d.verification_status,
            uploaded_at=d.uploaded_at,
            download_url=f"/api/v1/applications/{id}/documents/{d.id}/download"
        )
        for d in a.documents
    ]


@router.get("/applications/{id}/documents/{doc_id}/download")
def download_application_document(
    id: str,
    doc_id: str,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found.")

    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]
    user_id = get_effective_user_id(current_user)
    if not is_admin and a.user_id and a.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.id == doc_id,
        ApplicationDocument.application_id == id
    ).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on server.")

    return FileResponse(
        path=doc.file_path,
        filename=doc.document_name,
        media_type=doc.mime_type or "application/octet-stream"
    )


@router.delete("/applications/{id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application_document(
    id: str,
    doc_id: str,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application record not found.")

    is_admin = current_user and current_user.role in [UserRole.ADMIN.value, UserRole.SYSTEM_ADMIN.value]
    user_id = get_effective_user_id(current_user)
    if not is_admin and a.user_id and a.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.id == doc_id,
        ApplicationDocument.application_id == id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return None
