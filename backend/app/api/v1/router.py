from fastapi import APIRouter
from app.api.v1.endpoints import (
    schemes, taxonomy, eligibility, 
    benefits, documents, application, 
    sources, verification, intelligence,
    conversations, assistant, voice,
    citizen_applications, analytics, health,
    scheme_verification, integrations, personalization,
    notifications, user_governance
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
api_router.include_router(voice.router, tags=["voice"])
api_router.include_router(citizen_applications.router, tags=["citizen_applications"])
api_router.include_router(analytics.router, tags=["analytics"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(scheme_verification.router, tags=["scheme_verification"])
api_router.include_router(integrations.router, tags=["integrations"])
api_router.include_router(personalization.router, tags=["personalization"])
api_router.include_router(notifications.router, tags=["notifications"])
api_router.include_router(user_governance.router, tags=["user_governance"])
