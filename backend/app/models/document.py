from sqlalchemy import String, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.enums import DocumentType

class Document(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "documents"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_type: Mapped[DocumentType] = mapped_column(SQLEnum(DocumentType), nullable=False)

class SchemeDocument(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scheme_documents"

    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    mandatory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    condition: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="documents")
    document: Mapped["Document"] = relationship("Document")
