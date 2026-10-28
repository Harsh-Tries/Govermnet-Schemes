"""
Index Vector Chunks and Embeddings for All Published Maharashtra Schemes.
Enables hybrid semantic search and RAG retrieval.
"""

import sys
import os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import asyncio

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from app.db.session import SessionLocal
from app.models import Scheme
from app.models.vector import SchemeChunk, SchemeEmbedding
from app.enums import SchemeStatus
from app.services.vector.vector_service import VectorSearchService

async def index_all_published_schemes():
    db = SessionLocal()
    try:
        schemes = db.query(Scheme).filter(Scheme.status == SchemeStatus.PUBLISHED).all()
        print(f"Found {len(schemes)} published schemes to index for vector retrieval.", flush=True)
        
        for idx, scheme in enumerate(schemes, 1):
            await VectorSearchService.index_scheme_embeddings(db, scheme)
            print(f"[{idx}/{len(schemes)}] Indexed vector chunks for: {scheme.name} ({scheme.slug})", flush=True)

        total_chunks = db.query(SchemeChunk).count()
        total_embeddings = db.query(SchemeEmbedding).count()
        print("=" * 80, flush=True)
        print(f"VECTOR INDEXING COMPLETE: {total_chunks} chunks, {total_embeddings} embeddings.", flush=True)
        print("=" * 80, flush=True)
    finally:
        db.close()

if __name__ == "__main__":
    try:
        print("Starting vector indexing...", flush=True)
        asyncio.run(index_all_published_schemes())
    except Exception as e:
        import traceback
        traceback.print_exc()
