from typing import Any, Dict
from app.services.integrations.base import GovernmentAdapter

class MockGovernmentAdapter(GovernmentAdapter):
    def get_application_status(self, application_reference: str) -> Dict[str, Any]:
        """Simulate fetching status from official portal."""
        ref_upper = application_reference.upper()
        if "REJ" in ref_upper:
            status = "REJECTED"
            notes = "Income document invalid or expired."
        elif "APP" in ref_upper or "VER" in ref_upper:
            status = "DOCUMENTS_VERIFIED"
            notes = "Documents verified by Block Development Officer."
        else:
            status = "UNDER_REVIEW"
            notes = "Application submitted and under review at Ministry level."

        return {
            "application_reference": application_reference,
            "status": status,
            "source": "OFFICIAL_PORTAL_SYNC",
            "notes": notes,
            "verified_by_official": True
        }

    def submit_application(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate external portal submission."""
        return {
            "success": True,
            "application_reference": f"NSP-GOV-{payload.get('scheme_id', '999')[:4]}-8821",
            "status": "SUBMITTED",
            "message": "Application received successfully by official government portal."
        }

    def get_application_details(self, application_reference: str) -> Dict[str, Any]:
        return {
            "application_reference": application_reference,
            "department": "Ministry of Education / Social Justice",
            "portal_name": "National Scholarship Portal",
            "portal_url": "https://scholarships.gov.in"
        }
