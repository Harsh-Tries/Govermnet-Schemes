from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import UserBookmark, User
from app.models.scheme import Scheme
from app.enums import SchemeStatus
from app.schemas.scheme import SchemeResponse

router = APIRouter(prefix="/bookmarks", tags=["Citizen Bookmarks & Saved Schemes"])

class BookmarkToggleRequest(BaseModel):
    scheme_id: str
    user_id: str | None = "demo-citizen-user"

class BookmarkResponse(BaseModel):
    success: bool
    bookmarked: bool
    scheme_id: str
    user_id: str
    message: str

def get_or_create_user(db: Session, user_id: str) -> str:
    """Ensure user exists to satisfy foreign key constraint."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            email=f"{user_id}@example.gov.in",
            role="CITIZEN",
            is_active=True
        )
        db.add(user)
        db.commit()
    return user_id

@router.get("/ids", response_model=list[str])
def list_bookmarked_scheme_ids(
    user_id: str = Query("demo-citizen-user", description="Citizen user ID"),
    db: Session = Depends(get_db)
):
    """Retrieve the list of scheme IDs saved by the user."""
    bookmarks = db.query(UserBookmark.scheme_id).filter(UserBookmark.user_id == user_id).all()
    return [b[0] for b in bookmarks]

@router.get("", response_model=list[SchemeResponse])
def list_bookmarked_schemes(
    user_id: str = Query("demo-citizen-user", description="Citizen user ID"),
    db: Session = Depends(get_db)
):
    """Retrieve full details of all published schemes saved by the user."""
    schemes = (
        db.query(Scheme)
        .join(UserBookmark, Scheme.id == UserBookmark.scheme_id)
        .filter(UserBookmark.user_id == user_id)
        .filter(Scheme.status == SchemeStatus.PUBLISHED)
        .order_by(UserBookmark.created_at.desc())
        .all()
    )
    return schemes

@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_200_OK)
def add_bookmark(payload: BookmarkToggleRequest, db: Session = Depends(get_db)):
    """Save a scheme to the citizen's bookmarked schemes collection."""
    uid = payload.user_id or "demo-citizen-user"
    get_or_create_user(db, uid)

    # Validate scheme exists and is published
    scheme = db.query(Scheme).filter(Scheme.id == payload.scheme_id).first()
    if not scheme:
        # Check by slug
        scheme = db.query(Scheme).filter(Scheme.slug == payload.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    actual_scheme_id = scheme.id

    # Check for existing bookmark (prevent duplicates)
    existing = db.query(UserBookmark).filter(
        UserBookmark.user_id == uid,
        UserBookmark.scheme_id == actual_scheme_id
    ).first()

    if existing:
        return BookmarkResponse(
            success=True,
            bookmarked=True,
            scheme_id=actual_scheme_id,
            user_id=uid,
            message="Scheme is already bookmarked."
        )

    bookmark = UserBookmark(user_id=uid, scheme_id=actual_scheme_id)
    db.add(bookmark)
    db.commit()

    return BookmarkResponse(
        success=True,
        bookmarked=True,
        scheme_id=actual_scheme_id,
        user_id=uid,
        message="Scheme saved successfully."
    )

@router.delete("/{scheme_id}", response_model=BookmarkResponse)
def remove_bookmark(
    scheme_id: str,
    user_id: str = Query("demo-citizen-user", description="Citizen user ID"),
    db: Session = Depends(get_db)
):
    """Remove a scheme from the citizen's bookmarked schemes collection."""
    uid = user_id or "demo-citizen-user"

    # Match by ID or slug
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        scheme = db.query(Scheme).filter(Scheme.slug == scheme_id).first()
    
    actual_scheme_id = scheme.id if scheme else scheme_id

    bookmark = db.query(UserBookmark).filter(
        UserBookmark.user_id == uid,
        UserBookmark.scheme_id == actual_scheme_id
    ).first()

    if bookmark:
        db.delete(bookmark)
        db.commit()

    return BookmarkResponse(
        success=True,
        bookmarked=False,
        scheme_id=actual_scheme_id,
        user_id=uid,
        message="Scheme bookmark removed."
    )
