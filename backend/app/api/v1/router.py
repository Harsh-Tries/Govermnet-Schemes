from fastapi import APIRouter
from app.api.v1.endpoints import (
    schemes, taxonomy, eligibility, 
    benefits, documents, application, 
    sources, verification, intelligence,
    conversations, assistant
)

api_router = APIRouter()

api_router.include_router(schemes.router, tags=["schemes"])
api_router.include_router(taxonomy.router, tags=["taxonomy"])
api_router.include_router(eligibility.router, tags=["eligibility"])
api_router.include_router(benefits.router, tags=["benefits"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(application.router, tags=["application"])
api_router.include_router(sources.router, tags=["sources"])
api_router.include_router(verification.router, tags=["verification"])
api_router.include_router(intelligence.router, tags=["intelligence"])
api_router.include_router(conversations.router, tags=["conversations"])
api_router.include_router(assistant.router, tags=["assistant"])
