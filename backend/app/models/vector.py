from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class SchemeChunk(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scheme_chunks"

    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    chunk_type: Mapped[str] = mapped_column(String(50), nullable=False) # METADATA, ELIGIBILITY, BENEFITS, DOCUMENTS, APPLICATION
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme")
    embeddings: Mapped[list["SchemeEmbedding"]] = relationship("SchemeEmbedding", back_populates="chunk", cascade="all, delete-orphan")

class SchemeEmbedding(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scheme_embeddings"

    chunk_id: Mapped[str] = mapped_column(String(36), ForeignKey("scheme_chunks.id", ondelete="CASCADE"), nullable=False)
    embedding_json: Mapped[list[float]] = mapped_column("embedding", JSON, nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(100), default="text-embedding-3-small", nullable=False)

    chunk: Mapped["SchemeChunk"] = relationship("SchemeChunk", back_populates="embeddings")
