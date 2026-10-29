"""
Government Portal Verifier Service.
Validates, sanitizes, and categorizes official Indian and Maharashtra Government application portals.
Enforces strict security to prevent unsafe protocols (javascript:, data:, vbscript:) and construct
authentic portal identifiers based on verified government domains.
"""

import re
from urllib.parse import urlparse
from typing import Dict, Any, Optional

# Authorized Government Domain Suffixes for Maharashtra and Central Government Schemes
AUTHORIZED_GOV_DOMAINS = [
    ".gov.in",
    ".nic.in",
    ".mahaonline.gov.in",
    ".maharashtra.gov.in",
    ".jeevandayee.gov.in",
    ".pmkisan.gov.in",
    ".pmfby.gov.in",
    ".pmjay.gov.in",
    ".nha.gov.in",
    ".pmaymis.gov.in",
    ".maha-cmegp.gov.in",
    ".ladakibahin.maharashtra.gov.in"
]

# Canonical Official Portal Directory
PORTAL_REGISTRY: Dict[str, Dict[str, Any]] = {
    "mahadbt2": {
        "pattern": r"mahadbt2\.maharashtra\.gov\.in",
        "name": "MahaDBT 2.0 (AY 2026-27)",
        "description": "Maharashtra Direct Benefit Transfer 2.0 Portal for Fresh & Renewal Post-Matric Scholarships",
        "authority": "Government of Maharashtra",
        "is_direct_application": True
    },
    "mahadbt": {
        "pattern": r"mahadbt\.maharashtra\.gov\.in(?!/Farmer)",
        "name": "MahaDBT Portal",
        "description": "Maharashtra State Schemes & Direct Benefit Transfer Portal",
        "authority": "Government of Maharashtra",
        "is_direct_application": True
    },
    "mahadbt_farmer": {
        "pattern": r"mahadbt\.maharashtra\.gov\.in/Farmer",
        "name": "MahaDBT Farmer Portal",
        "description": "Maharashtra Agriculture Mechanization, Drip Irrigation & Farm Subsidies Portal",
        "authority": "Department of Agriculture, Maharashtra",
        "is_direct_application": True
    },
    "dte_maharashtra": {
        "pattern": r"dte\.maharashtra\.gov\.in",
        "name": "Maharashtra DTE Portal",
        "description": "Directorate of Technical Education, Maharashtra",
        "authority": "Directorate of Technical Education, Mumbai",
        "is_direct_application": False  # Department informational / verification portal
    },
    "pmkisan": {
        "pattern": r"pmkisan\.gov\.in",
        "name": "PM-KISAN Portal",
        "description": "Pradhan Mantri Kisan Samman Nidhi Central Application & eKYC Portal",
        "authority": "Ministry of Agriculture and Farmers Welfare, GoI",
        "is_direct_application": True
    },
    "krishi_maharashtra": {
        "pattern": r"krishi\.maharashtra\.gov\.in",
        "name": "Maharashtra Krishi Portal",
        "description": "Department of Agriculture, Government of Maharashtra (Namo Shetkari Portal)",
        "authority": "Department of Agriculture, Maharashtra",
        "is_direct_application": True
    },
    "aaplesarkar": {
        "pattern": r"aaplesarkar\.mahaonline\.gov\.in",
        "name": "Aaple Sarkar MahaOnline",
        "description": "Maharashtra Public Services Citizen Portal",
        "authority": "Government of Maharashtra",
        "is_direct_application": True
    },
    "cmegp": {
        "pattern": r"maha-cmegp\.gov\.in",
        "name": "CMEGP Maharashtra Portal",
        "description": "Chief Minister Employment Generation Programme Application Portal",
        "authority": "Directorate of Industries, Maharashtra",
        "is_direct_application": True
    },
    "pmfby": {
        "pattern": r"pmfby\.gov\.in",
        "name": "PMFBY Crop Insurance Portal",
        "description": "Pradhan Mantri Fasal Bima Yojana Portal",
        "authority": "Ministry of Agriculture and Farmers Welfare, GoI",
        "is_direct_application": True
    },
    "mjpjay": {
        "pattern": r"jeevandayee\.gov\.in",
        "name": "MJPJAY Health Portal",
        "description": "Mahatma Jyotirao Phule Jan Arogya Yojana State Health Portal",
        "authority": "State Health Assurance Society, Maharashtra",
        "is_direct_application": True
    },
    "ab_pmjay": {
        "pattern": r"beneficiary\.nha\.gov\.in|pmjay\.gov\.in",
        "name": "Ayushman Bharat PM-JAY",
        "description": "National Health Authority Ayushman Card Portal",
        "authority": "National Health Authority, GoI",
        "is_direct_application": True
    },
    "ladki_bahin": {
        "pattern": r"ladakibahin\.maharashtra\.gov\.in",
        "name": "Ladki Bahin Portal",
        "description": "Mukhyamantri Majhi Ladki Bahin Yojana Official State Portal",
        "authority": "Women and Child Development Department, Maharashtra",
        "is_direct_application": True
    },
    "state_portal": {
        "pattern": r"maharashtra\.gov\.in",
        "name": "Maharashtra State Portal",
        "description": "Official Web Portal of Government of Maharashtra",
        "authority": "Government of Maharashtra",
        "is_direct_application": False
    }
}

class PortalVerifier:
    """Verifies security, authority, and application mode of government URLs."""

    @staticmethod
    def is_safe_url(url: Optional[str]) -> bool:
        """
        Validates URL security.
        Ensures protocol is strictly http/https and blocks dangerous injection schemes.
        """
        if not url or not isinstance(url, str):
            return False

        trimmed = url.strip()
        # Disallow dangerous schemes
        lowered = trimmed.lower()
        if any(lowered.startswith(bad) for bad in ["javascript:", "data:", "vbscript:", "file:", "about:"]):
            return False

        try:
            parsed = urlparse(trimmed)
            if parsed.scheme not in ["http", "https"]:
                return False
            if not parsed.netloc:
                return False
            return True
        except Exception:
            return False

    @staticmethod
    def is_official_gov_destination(url: Optional[str]) -> bool:
        """
        Validates whether destination hostname is an authoritative government domain.
        """
        if not PortalVerifier.is_safe_url(url):
            return False

        try:
            parsed = urlparse(url.strip())
            hostname = (parsed.hostname or "").lower()
            return any(
                hostname == domain.lstrip(".") or hostname.endswith(domain)
                for domain in AUTHORIZED_GOV_DOMAINS
            )
        except Exception:
            return False

    @staticmethod
    def get_portal_metadata(url: Optional[str]) -> Dict[str, Any]:
        """
        Analyzes an official URL and extracts verified portal identity, display label,
        and application status.
        """
        if not url or not PortalVerifier.is_safe_url(url):
            return {
                "is_verified": False,
                "is_safe": False,
                "portal_name": None,
                "action_label": "Official Portal Unavailable",
                "is_direct_application": False,
                "authority": None,
                "clean_url": None
            }

        clean_url = url.strip()
        is_gov = PortalVerifier.is_official_gov_destination(clean_url)

        matched_portal = None
        for key, p_data in PORTAL_REGISTRY.items():
            if re.search(p_data["pattern"], clean_url, re.IGNORECASE):
                matched_portal = p_data
                break

        if matched_portal:
            action_label = f"Apply on {matched_portal['name']}" if matched_portal["is_direct_application"] else "View Official Guidelines"
            return {
                "is_verified": is_gov,
                "is_safe": True,
                "portal_name": matched_portal["name"],
                "action_label": action_label,
                "is_direct_application": matched_portal["is_direct_application"],
                "authority": matched_portal["authority"],
                "clean_url": clean_url
            }

        # Fallback for other valid government portals
        return {
            "is_verified": is_gov,
            "is_safe": True,
            "portal_name": "Official Government Portal",
            "action_label": "Apply via Official Portal" if is_gov else "Visit Official Destination",
            "is_direct_application": is_gov,
            "authority": "Government Portal",
            "clean_url": clean_url
        }
