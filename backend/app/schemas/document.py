from pydantic import BaseModel, ConfigDict
from app.enums import DocumentType

class DocumentBase(BaseModel):
    name: str
    description: str | None = None
    document_type: DocumentType

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class SchemeDocumentBase(BaseModel):
    document_id: str
    mandatory: bool = True
    condition: str | None = None
    notes: str | None = None

class SchemeDocumentCreate(SchemeDocumentBase):
    pass

class SchemeDocumentResponse(SchemeDocumentBase):
    id: str
    scheme_id: str
    document: DocumentResponse | None = None
    model_config = ConfigDict(from_attributes=True)
