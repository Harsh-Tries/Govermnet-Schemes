from sqlalchemy.orm import Session
from app.models import Scheme
from app.ai.retrieval import SchemeRetriever
from app.services.vector.vector_service import VectorSearchService

class HybridRetriever:
    """
    Hybrid Retrieval Engine combining SQL Keyword Search with Semantic Vector Search
    using Reciprocal Rank Fusion (RRF).
    """

    @classmethod
    async def hybrid_search(
        cls, 
        db: Session, 
        query: str, 
        limit: int = 10,
        rrf_k: int = 60
    ) -> list[Scheme]:
        # 1. Keyword search results
        keyword_schemes = SchemeRetriever.search_published_schemes(db, query=query, limit=20)
        
        # 2. Vector semantic search results
        vector_results = await VectorSearchService.search_vector_similarity(db, query=query, limit=20)
        
        # 3. Reciprocal Rank Fusion (RRF) scoring
        rrf_scores: dict[str, float] = {}

        # Rank keyword results
        for rank, s in enumerate(keyword_schemes, start=1):
            rrf_scores[s.id] = rrf_scores.get(s.id, 0.0) + (1.0 / (rrf_k + rank))

        # Rank vector results
        vector_scheme_ids_seen = set()
        v_rank = 1
        for chunk, sim_score in vector_results:
            sid = chunk.scheme_id
            if sid not in vector_scheme_ids_seen:
                vector_scheme_ids_seen.add(sid)
                rrf_scores[sid] = rrf_scores.get(sid, 0.0) + (1.0 / (rrf_k + v_rank))
                v_rank += 1

        # Sort scheme IDs by fused RRF score
        sorted_scheme_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)[:limit]

        # Retrieve scheme objects in sorted rank order
        final_schemes: list[Scheme] = []
        for sid in sorted_scheme_ids:
            s = db.query(Scheme).filter(Scheme.id == sid).first()
            if s and s not in final_schemes:
                final_schemes.append(s)

        # Fallback to pure keyword search if no hybrid results
        if not final_schemes:
            return keyword_schemes[:limit]

        return final_schemes
