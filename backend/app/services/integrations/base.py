from abc import ABC, abstractmethod
from typing import Any, Dict

class GovernmentAdapter(ABC):
    def __init__(self, integration_id: str, base_url: str, api_key: str | None = None):
        self.integration_id = integration_id
        self.base_url = base_url
        self.api_key = api_key

    @abstractmethod
    def get_application_status(self, application_reference: str) -> Dict[str, Any]:
        """Fetch application status from official portal."""
        pass

    @abstractmethod
    def submit_application(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Submit application to official portal if supported."""
        pass

    @abstractmethod
    def get_application_details(self, application_reference: str) -> Dict[str, Any]:
        """Fetch detailed application metadata."""
        pass
