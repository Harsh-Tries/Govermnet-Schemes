from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Document, SchemeDocument, Scheme
from app.schemas.document import (
    DocumentCreate, DocumentResponse,
    SchemeDocumentCreate, SchemeDocumentResponse
)

router = APIRouter()

@router.get("/documents", response_model=list[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()

@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(payload: DocumentCreate, db: Session = Depends(get_db)):
    doc = Document(**payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.get("/schemes/{scheme_id}/documents", response_model=list[SchemeDocumentResponse])
def get_scheme_documents(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return db.query(SchemeDocument).filter(SchemeDocument.scheme_id == scheme_id).all()

@router.post("/schemes/{scheme_id}/documents", response_model=SchemeDocumentResponse, status_code=status.HTTP_201_CREATED)
def add_scheme_document(scheme_id: str, payload: SchemeDocumentCreate, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    doc = db.query(Document).filter(Document.id == payload.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document entity not found.")

    scheme_doc = SchemeDocument(scheme_id=scheme_id, **payload.model_dump())
    db.add(scheme_doc)
    db.commit()
    db.refresh(scheme_doc)
    return scheme_doc
