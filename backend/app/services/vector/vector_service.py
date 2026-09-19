import math
from typing import Any
from sqlalchemy.orm import Session, joinedload
from app.models.vector import SchemeChunk, SchemeEmbedding
from app.models import Scheme
from app.enums import SchemeStatus
from app.ai.providers.factory import get_llm_provider

class VectorSearchService:
    """
    Vector Search & Similarity Service.
    Computes Cosine Similarity over generated chunk embeddings with metadata filtering.
    """

    @staticmethod
    def _cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = math.sqrt(sum(a * a for a in vec1))
        norm_b = math.sqrt(sum(b * b for b in vec2))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    @classmethod
    async def index_scheme_embeddings(cls, db: Session, scheme: Scheme):
        """Generate and store chunk embeddings for a scheme."""
        from app.services.vector.chunker import SchemeChunkerService
        llm = get_llm_provider()

        # Delete old chunks
        db.query(SchemeChunk).filter(SchemeChunk.scheme_id == scheme.id).delete()
        db.commit()

        chunks = SchemeChunkerService.create_chunks_for_scheme(scheme)
        for c in chunks:
            db.add(c)
            db.commit()
            db.refresh(c)

            emb_vector = await llm.generate_embedding(c.content)
            emb = SchemeEmbedding(
                chunk_id=c.id,
                embedding_json=emb_vector,
                embedding_model="text-embedding-3-small"
            )
            db.add(emb)
        db.commit()

    @classmethod
    async def search_vector_similarity(
        cls, 
        db: Session, 
        query: str, 
        limit: int = 5,
        chunk_type: str | None = None
    ) -> list[tuple[SchemeChunk, float]]:
        llm = get_llm_provider()
        query_vector = await llm.generate_embedding(query)

        q = db.query(SchemeEmbedding).join(SchemeChunk).join(Scheme).filter(Scheme.status == SchemeStatus.PUBLISHED)
        if chunk_type:
            q = q.filter(SchemeChunk.chunk_type == chunk_type)

        all_embeddings = q.options(joinedload(SchemeEmbedding.chunk)).all()

        scored_chunks: list[tuple[SchemeChunk, float]] = []
        for emb in all_embeddings:
            sim = cls._cosine_similarity(query_vector, emb.embedding_json)
            scored_chunks.append((emb.chunk, sim))

        # Sort descending by similarity score
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:limit]
