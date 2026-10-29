"""
Deterministic Scheme Ranking & Relevance Service.
Ranks published Maharashtra and Central schemes against authenticated citizen profiles.
Prioritizes genuine farmer schemes and OBC student scholarships for Maharashtra residents
with explainable, transparent rules and verified official government application portals.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.scheme import Scheme
from app.enums import SchemeStatus, GovernmentLevel
from app.services.eligibility.evaluator import DeterministicEligibilityEvaluator
from app.services.portal.portal_verifier import PortalVerifier

class SchemeRankingService:
    """Evaluates and ranks all candidate schemes with transparent scoring."""

    @staticmethod
    def rank_schemes_for_citizen(
        db: Session,
        citizen_profile: Dict[str, Any],
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Rank published schemes deterministically.
        Order of Importance:
        1. Active published scheme with verified portal.
        2. Citizen matches mandatory eligibility criteria.
        3. Beneficiary category matches (e.g. OBC).
        4. Education, course, occupation, income, and location match.
        5. Required information available vs missing.
        6. Official application destination available.
        7. Specific profile relevancy (Farmer & OBC Student affinities).
        """
        # 1. Normalize citizen profile attributes
        c_state = citizen_profile.get("state_code") or citizen_profile.get("state") or "IN-MH"
        is_mh_resident = citizen_profile.get("is_maharashtra_resident", True)
        if c_state in ["IN-MH", "MH", "Maharashtra"]:
            is_mh_resident = True

        c_income = citizen_profile.get("annual_income")
        if c_income is None:
            c_income = citizen_profile.get("income", 220000)
        try:
            c_income = float(c_income)
        except (ValueError, TypeError):
            c_income = 220000.0

        c_category = str(citizen_profile.get("caste_category") or citizen_profile.get("category") or "OBC").upper()
        c_occupation = str(citizen_profile.get("occupation_type") or citizen_profile.get("profession") or citizen_profile.get("occupation") or "").upper()
        c_gender = str(citizen_profile.get("gender") or "MALE").upper()
        c_age = citizen_profile.get("age", 21)

        # Beneficiary groups
        c_beneficiaries = [str(b).upper() for b in citizen_profile.get("beneficiary_categories") or []]

        is_student = (
            "STUDENT" in c_occupation or
            "STUDENTS" in c_beneficiaries or
            citizen_profile.get("student_status") is True or
            bool(citizen_profile.get("student_details"))
        )

        is_farmer = (
            "FARMER" in c_occupation or
            "AGRICULTURE" in c_occupation or
            "FARMERS" in c_beneficiaries or
            citizen_profile.get("farmer_status") is True or
            bool(citizen_profile.get("farmer_details")) or
            (citizen_profile.get("landholding_acres") and float(citizen_profile.get("landholding_acres")) > 0)
        )

        # Standard dictionary passed to DeterministicEvaluator
        eval_profile = {
            "state_code": "IN-MH" if is_mh_resident else c_state,
            "state": "IN-MH" if is_mh_resident else c_state,
            "annual_income": c_income,
            "income": c_income,
            "caste_category": c_category,
            "category": c_category,
            "occupation_type": c_occupation,
            "profession": c_occupation,
            "student_status": is_student,
            "farmer_status": is_farmer,
            "gender": c_gender,
            "age": c_age,
            "landholding_acres": citizen_profile.get("landholding_acres", 2.5 if is_farmer else 0.0)
        }

        # 2. Query all published schemes
        schemes = (
            db.query(Scheme)
            .filter(Scheme.status == SchemeStatus.PUBLISHED)
            .all()
        )

        ranked_results = []

        for scheme in schemes:
            s_name = scheme.name or ""
            s_slug = scheme.slug or ""
            s_lower = f"{s_name} {scheme.short_description or ''}".lower()

            # A. Extract application URL and verify portal
            app_url = None
            if scheme.application_process and scheme.application_process.official_application_url:
                app_url = scheme.application_process.official_application_url
            elif scheme.sources:
                for src in scheme.sources:
                    if src.source and src.source.url:
                        app_url = src.source.url
                        break

            portal_info = PortalVerifier.get_portal_metadata(app_url)
            verified_apply_url = portal_info["clean_url"] if portal_info["is_safe"] else None

            # B. Deterministic Rule Evaluation
            eval_result = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, eval_profile)

            status = eval_result.status
            explanation_factors: List[str] = []
            review_notes: List[str] = []
            affinity_score = 0
            category_boost = 0

            # C. Domain-Specific Rule Refinements & Contextual Explanations

            # 1. OBC Higher Education & Tuition Fee Assistance
            if "tuition fees" in s_lower and "obc" in s_lower:
                if is_student and c_category in ["OBC", "VJNT", "SBC"]:
                    if c_income <= 800000:
                        status = "ELIGIBLE"
                        explanation_factors.append("Matches your OBC category and student status.")
                        explanation_factors.append(f"Annual family income of ₹{int(c_income):,} is within the ₹8,00,000 Non-Creamy Layer ceiling.")
                        explanation_factors.append("Reimburses 50% tuition and exam fees on MahaDBT 2.0.")
                        affinity_score += 38
                        category_boost += 10
                    else:
                        status = "NOT_ELIGIBLE"
                        explanation_factors.append("Annual family income exceeds ₹8,00,000 threshold.")
                else:
                    if not is_student:
                        status = "NOT_ELIGIBLE"
                        explanation_factors.append("Requires active student enrollment in higher education.")
                    if c_category not in ["OBC", "VJNT", "SBC"]:
                        status = "NOT_ELIGIBLE"
                        explanation_factors.append(f"Scheme is reserved for OBC/VJNT/SBC; your profile indicates {c_category}.")

            # 2. Post-Matric Maintenance Allowance Scholarship for OBC/VJNT
            elif "post-matric" in s_lower and "obc" in s_lower:
                if is_student and c_category in ["OBC", "VJNT", "SBC"]:
                    if c_income <= 150000:
                        status = "ELIGIBLE"
                        explanation_factors.append("Matches your OBC category and student status.")
                        explanation_factors.append(f"Annual income of ₹{int(c_income):,} is within ₹1,50,000 cap.")
                        affinity_score += 30
                        category_boost += 10
                    else:
                        status = "NOT_ELIGIBLE"
                        explanation_factors.append(f"Annual income of ₹{int(c_income):,} exceeds the ₹1,50,000 threshold for full maintenance allowance.")
                        explanation_factors.append("Eligible for 50% Tuition Fee Reimbursement scheme instead.")
                else:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append("Profile category or student criteria does not match.")

            # 3. Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh (EBC)
            elif "rajarshi" in s_lower or "ebc" in s_lower:
                if c_category in ["OBC", "SC", "ST", "VJNT", "SBC"]:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append("Reserved for Open / General / EWS category students.")
                    explanation_factors.append(f"As an {c_category} student, apply under the OBC Tuition & Exam Fee scheme on MahaDBT.")
                elif is_student and c_income <= 800000:
                    status = "ELIGIBLE"
                    explanation_factors.append("Matches Open/EBC student criteria with income under ₹8,00,000.")
                    affinity_score += 30
                else:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append("Criteria not satisfied.")

            # 4. Dr. Panjabrao Deshmukh Vasatgruh Nirvah Bhatta Yojna (Hostel allowance for farmer children)
            elif "panjabrao" in s_lower:
                if is_student:
                    if is_farmer or bool(citizen_profile.get("farmer_details")):
                        if c_income <= 800000:
                            status = "CHECK_REQUIRED"
                            explanation_factors.append("Your farming household background and student status qualify under scheme guidelines.")
                            explanation_factors.append(f"Annual family income of ₹{int(c_income):,} is within the ₹8,00,000 ceiling for farmer wards.")
                            review_notes.append("CAP admission allotment letter and Tahsildar Alpabhudharak (marginal farmer) certificate required.")
                            review_notes.append("Hostel admission receipt or rented room agreement required.")
                            affinity_score += 36
                        else:
                            status = "NOT_ELIGIBLE"
                            explanation_factors.append(f"Annual income of ₹{int(c_income):,} exceeds the ₹8,00,000 limit.")
                    else:
                        # Non-farmer general student cap is ₹1,00,000
                        if c_income <= 100000:
                            status = "CHECK_REQUIRED"
                            explanation_factors.append("Income within ₹1,00,000 limit for general students; hostel proof required.")
                            affinity_score += 18
                        else:
                            status = "NOT_ELIGIBLE"
                            explanation_factors.append(f"Non-farmer student income limit is ₹1,00,000; your profile states ₹{int(c_income):,}.")
                else:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append("Scheme is exclusively for higher technical education students.")

            # 5. Namo Shetkari Mahasanman Nidhi (NSMNY)
            elif "namo shetkari" in s_lower:
                if is_farmer:
                    if is_mh_resident:
                        status = "CHECK_REQUIRED"
                        explanation_factors.append("Matches Maharashtra farmer criteria for ₹6,000/yr State DBT.")
                        review_notes.append("Active approved PM-KISAN beneficiary registration in Maharashtra required.")
                        review_notes.append("Cultivable land record (7/12 & 8-A extract) verification required.")
                        affinity_score += 38
                    else:
                        status = "NOT_ELIGIBLE"
                        explanation_factors.append("Maharashtra residency required for State Namo Shetkari scheme.")
                else:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append("Exclusively for active landholding farmers.")

            # 6. PM-KISAN in Maharashtra
            elif "pm-kisan" in s_lower or "pradhan mantri kisan" in s_lower:
                if is_farmer:
                    status = "CHECK_REQUIRED"
                    explanation_factors.append("Matches farming occupation background for ₹6,000/yr Central DBT.")
                    review_notes.append("Cultivable land ownership in revenue records (7/12) and active eKYC required.")
                    affinity_score += 32
                else:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append("Exclusively for landholding farmer families.")

            # 7. Other Farmer Schemes (Mechanization, Drip, Crop Insurance)
            elif any(k in s_lower for k in ["krishi", "shet", "fasal bima", "farm pond", "mechanization"]):
                if is_farmer:
                    status = "CHECK_REQUIRED"
                    explanation_factors.append("Your farming background is relevant for agricultural assistance.")
                    review_notes.append("Specific landholding acreage and Aadhaar eKYC on MahaDBT Farmer required.")
                    if "mechanization" in s_lower or "yantrikikaran" in s_lower:
                        affinity_score += 28
                    else:
                        affinity_score += 25
                else:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append("Agricultural schemes require confirmed farmer/cultivator status.")

            # 8. Reserved Caste Schemes (SC / ST / Swadhar)
            elif any(k in s_lower for k in ["for sc", "for st", "swadhar", "ramai", "shabari"]):
                if "sc" in s_lower and c_category not in ["SC", "NEO-BUDDHIST"]:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append(f"Reserved for Scheduled Caste; your profile indicates {c_category}.")
                elif "st" in s_lower and c_category != "ST":
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append(f"Reserved for Scheduled Tribe; your profile indicates {c_category}.")
                else:
                    affinity_score += 15

            # 9. Women & Child Schemes (Ladki Bahin, Lek Ladki, Kanya Kalyani)
            elif any(k in s_lower for k in ["ladki bahin", "lek ladki", "kanya"]):
                if c_gender != "FEMALE":
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append(f"Exclusively for female beneficiaries; your profile indicates {c_gender.title()}.")
                else:
                    affinity_score += 20

            # 10. Senior Citizen Schemes (Shravanbal)
            elif "shravanbal" in s_lower:
                if c_age < 65:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append(f"Requires age 65 or above; your profile states {c_age} years.")
                else:
                    affinity_score += 20

            # Fallback evaluation from engine if status not already customized
            if not explanation_factors:
                if eval_result.status == "ELIGIBLE":
                    status = "ELIGIBLE"
                    explanation_factors.append("All published eligibility criteria are satisfied by your profile.")
                    affinity_score += 10
                elif eval_result.status == "UNKNOWN":
                    status = "CHECK_REQUIRED"
                    explanation_factors.append("Potential match; additional institutional or document verification required.")
                    affinity_score += 8
                else:
                    status = "NOT_ELIGIBLE"
                    explanation_factors.append("Current profile does not satisfy all published criteria.")

            # D. Dynamic Deterministic Score Calculation
            if status == "ELIGIBLE":
                base_score = 50
                state_boost = 5 if scheme.government_level == GovernmentLevel.STATE else 0
                portal_boost = 5 if portal_info["is_verified"] and portal_info["is_direct_application"] else (3 if portal_info["is_verified"] else 0)
                final_score = min(98, base_score + affinity_score + category_boost + state_boost + portal_boost)
            elif status == "CHECK_REQUIRED":
                base_score = 45
                state_boost = 5 if scheme.government_level == GovernmentLevel.STATE else 0
                portal_boost = 5 if portal_info["is_verified"] and portal_info["is_direct_application"] else (3 if portal_info["is_verified"] else 0)
                final_score = min(95, base_score + affinity_score + category_boost + state_boost + portal_boost)
            else: # NOT_ELIGIBLE
                final_score = 0

            # Consolidated explainable factor list
            all_factors = explanation_factors + [f"⚠ {r}" for r in review_notes]

            ranked_results.append({
                "scheme_id": scheme.id,
                "scheme_name": scheme.name,
                "slug": scheme.slug,
                "short_description": scheme.short_description,
                "government_level": scheme.government_level.value if scheme.government_level else "STATE",
                "department": scheme.administering_ministry or "Government of Maharashtra",
                "benefit_amount": scheme.benefits[0].title if scheme.benefits else "Direct Assistance",
                "eligibility_status": status,
                "match_score": final_score,
                "explanation_factors": all_factors,
                "review_notes": review_notes,
                "missing_information": eval_result.missing_information,
                "official_url": verified_apply_url,
                "portal_name": portal_info["portal_name"],
                "action_label": portal_info["action_label"],
                "is_direct_application": portal_info["is_direct_application"],
                "verified": bool(scheme.sources and len(scheme.sources) > 0),
                "published_at": scheme.published_at.isoformat() if scheme.published_at else None
            })

        # 3. Sort by priority:
        # Priority 1: ELIGIBLE and CHECK_REQUIRED first (NOT_ELIGIBLE at bottom)
        # Priority 2: Highest match score first
        # Priority 3: State schemes prioritized over central
        ranked_results.sort(
            key=lambda x: (
                x["eligibility_status"] in ["ELIGIBLE", "CHECK_REQUIRED"],
                x["match_score"],
                x["government_level"] == "STATE",
                x["is_direct_application"]
            ),
            reverse=True
        )

        return ranked_results[:limit]
