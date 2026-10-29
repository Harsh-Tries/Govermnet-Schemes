import re
import json
import hashlib
from typing import Type, TypeVar, Any
from pydantic import BaseModel
from app.ai.providers.base import LLMProvider

T = TypeVar('T', bound=BaseModel)

class MockLocalProvider(LLMProvider):
    """
    Deterministic Mock LLM Provider for local development, offline usage, 
    and regression test suites without external API key dependencies.
    Accurately supports Maharashtra government schemes, deterministic entity extraction,
    and grounded response synthesis.
    """

    provider_name: str = "mock"
    is_mock: bool = True

    def check_health(self) -> tuple[bool, str]:
        return True, "Deterministic Mock Provider is active and ready"

    def get_provider_info(self) -> dict[str, Any]:
        return {
            "provider": self.provider_name,
            "model": "rule-based-mock",
            "is_mock": True,
            "status": "READY",
            "health_ok": True,
            "message": "Development & Test Deterministic Mock Provider"
        }

    async def generate_response(
        self, 
        messages: list[dict[str, str]], 
        system_prompt: str | None = None,
        temperature: float = 0.2
    ) -> str:
        last_user_msg = ""
        context_str = ""
        for m in reversed(messages):
            content = m.get("content", "")
            if m.get("role") == "user":
                if "USER QUERY:" in content:
                    context_str = content
                    # Extract raw query from context
                    m_match = re.search(r"USER QUERY:\s*(.*?)\nINTENT:", content, re.DOTALL)
                    if m_match:
                        last_user_msg = m_match.group(1).lower().strip()
                elif not last_user_msg:
                    last_user_msg = content.lower().strip()

        # 1. Check for Out-of-Scope queries
        if any(w in last_user_msg for w in ["capital of", "weather", "write code", "python script", "who is the president of"]):
            return (
                "I specialize exclusively in Indian government schemes, scholarships, and citizen welfare programs "
                "(with dedicated focus on Maharashtra). Please ask a question related to schemes, eligibility, or benefits."
            )

        # 2. Check for Greetings
        if any(last_user_msg == g or last_user_msg.startswith(g + " ") for g in ["hi", "hello", "namaste", "hey", "good morning", "good afternoon"]):
            return (
                "Namaste! I am the Maharashtra Government Schemes and Scholarships Assistant. "
                "I can help you find verified State and Central welfare schemes, evaluate your eligibility, "
                "and explain application procedures and required documents."
            )

        # 3. Check for State vs Central distinction question
        if "difference between" in last_user_msg and ("state" in last_user_msg or "central" in last_user_msg):
            return (
                "In Maharashtra, government welfare initiatives fall into two principal categories:\n\n"
                "1. **Maharashtra State Schemes:** Formulated, funded, and administered directly by Maharashtra Government departments "
                "(e.g., Mukhyamantri Majhi Ladki Bahin Yojana, Rajarshi Shahu Maharaj EBC Scholarship, Namo Shetkari Mahasanman Nidhi). "
                "These require Maharashtra domicile.\n\n"
                "2. **Central Government Schemes:** Sponsored by the Government of India and implemented across Maharashtra through state nodal departments "
                "(e.g., PM-KISAN, Ayushman Bharat PM-JAY, PMAY-Urban). In some schemes, Maharashtra provides an additional state top-up."
            )

        # 4. Synthesize from Verified Tool Results & Phase 3 Eligibility in context
        if "PHASE 3 ELIGIBILITY RESULTS:" in context_str:
            # Check for eligibility outcomes in context
            if "'status': 'ELIGIBLE'" in context_str or '"status": "ELIGIBLE"' in context_str:
                return (
                    "Based on our deterministic Phase 3 evaluation of your profile against official government criteria, "
                    "**you qualify as eligible** for this scheme. You can review the required documents and submit your application "
                    "on the official designated government portal."
                )
            elif "'status': 'NOT_ELIGIBLE'" in context_str or '"status": "NOT_ELIGIBLE"' in context_str:
                return (
                    "Based on our deterministic Phase 3 evaluation against official government rules, "
                    "**you are currently not eligible** because one or more mandatory conditions were not satisfied. "
                    "Please check the failed conditions listed in the eligibility breakdown."
                )
            elif "'status': 'UNKNOWN'" in context_str or '"status": "UNKNOWN"' in context_str:
                return (
                    "To accurately determine your eligibility, additional profile details are required. "
                    "Please provide the requested missing parameters so the eligibility engine can evaluate your status."
                )

        if "VERIFIED TOOL RESULTS:" in context_str and ("[" in context_str and "]" in context_str):
            if "scholarship" in last_user_msg or "student" in last_user_msg:
                return (
                    "Based on verified Maharashtra Government records, key scholarships available for students include:\n"
                    "- **Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna (EBC)**: 50%–100% Tuition fee waiver.\n"
                    "- **Government of India Post-Matric Scholarship for SC Students (Maharashtra)**: Full tuition coverage + maintenance allowance.\n"
                    "- **Post-Matric Scholarship for VJNT, OBC and SBC Students** on MahaDBT.\n"
                    "- **Dr. Panjabrao Deshmukh Vasatgruh Nirvah Bhatta Yojna**: Hostel and meal allowance up to ₹60,000/yr."
                )
            elif "farmer" in last_user_msg or "agriculture" in last_user_msg or "shetkari" in last_user_msg:
                return (
                    "Based on verified government records, key assistance schemes for farmers in Maharashtra include:\n"
                    "- **Namo Shetkari Mahasanman Nidhi Yojana (NSMNY)**: ₹6,000/year direct financial assistance.\n"
                    "- **Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)**: ₹6,000/year central income support.\n"
                    "- **MahaDBT Krishi Yantrikikaran Yojna**: 40%–50% subsidy on farm implements and tractors.\n"
                    "- **Dr. Babasaheb Ambedkar Krushi Swavalamban Yojana**: Up to ₹4,00,000 grant for new wells for SC farmers."
                )
            elif "entrepreneur" in last_user_msg or "business" in last_user_msg or "msme" in last_user_msg:
                return (
                    "Based on verified government records, key assistance schemes for entrepreneurs and MSMEs in Maharashtra include:\n"
                    "- **Chief Minister Employment Generation Programme (CMEGP - Maharashtra)**: Financial assistance up to ₹50 Lakhs for manufacturing and ₹10 Lakhs for services with 15%–35% subsidy.\n"
                    "- **Prime Minister's Employment Generation Programme (PMEGP)**: Credit-linked subsidy up to ₹50 Lakhs for setting up micro-enterprises.\n"
                    "- **Pradhan Mantri MUDRA Yojana**: Collateral-free micro loans up to ₹10 Lakhs (Shishu, Kishore, Tarun).\n"
                    "- **Stand-Up India Scheme**: Bank loans between ₹10 Lakhs and ₹1 Crore for SC/ST and women entrepreneurs."
                )
            elif "ladki bahin" in last_user_msg:
                return (
                    "**Mukhyamantri Majhi Ladki Bahin Yojana** provides ₹1,500 monthly DBT (₹18,000 annually) "
                    "to eligible women aged 21–65 residing in Maharashtra with annual family income up to ₹2,50,000. "
                    "Applications are accepted online via the official Ladki Bahin portal."
                )
            elif "document" in last_user_msg:
                return (
                    "Based on verified government guidelines, required documents typically include:\n"
                    "- Aadhaar Card (linked to bank account)\n"
                    "- Maharashtra Domicile Certificate\n"
                    "- Tahsildar Income Certificate\n"
                    "- Caste Certificate (for reserved category schemes)\n"
                    "- 7/12 & 8-A Land Extract (for agricultural schemes)"
                )
            elif "apply" in last_user_msg:
                return (
                    "You can apply online via the official designated government portal (such as MahaDBT or the scheme-specific portal). "
                    "Ensure your Aadhaar is linked to your bank account for Direct Benefit Transfer (DBT)."
                )

        # Standard fallback responses
        if "scholarship" in last_user_msg or "student" in last_user_msg:
            return (
                "Based on verified Maharashtra Government records, key scholarships for students include:\n"
                "- **Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna (EBC)**: 50%–100% Tuition fee waiver on MahaDBT.\n"
                "- **Government of India Post-Matric Scholarship for SC Students (Maharashtra)**: Full tuition waiver & maintenance allowance.\n"
                "- **Post-Matric Scholarship for VJNT, OBC and SBC Students** on MahaDBT.\n"
                "- **Dr. Panjabrao Deshmukh Vasatgruh Nirvah Bhatta Yojna**: Hostel allowance up to ₹60,000/year."
            )
        elif "farmer" in last_user_msg or "kisan" in last_user_msg or "agriculture" in last_user_msg:
            return (
                "Based on verified government records, major welfare schemes for Maharashtra farmers include:\n"
                "- **Namo Shetkari Mahasanman Nidhi Yojana (NSMNY)**: ₹6,000/year direct financial assistance from Maharashtra Govt.\n"
                "- **Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)**: ₹6,000/year Central income support (combined ₹12,000/year).\n"
                "- **MahaDBT Krishi Yantrikikaran Yojna**: 40%–50% subsidy on agricultural implements and tractors.\n"
                "- **Dr. Babasaheb Ambedkar Krushi Swavalamban Yojana**: Up to ₹4 Lakh grant for new irrigation wells."
            )
        elif "entrepreneur" in last_user_msg or "msme" in last_user_msg or "business" in last_user_msg:
            return (
                "Based on verified government records, key initiatives for entrepreneurs and MSMEs in Maharashtra include:\n"
                "- **Chief Minister Employment Generation Programme (CMEGP)**: Margin money subsidy up to 35% on projects up to ₹50 Lakhs.\n"
                "- **Prime Minister's Employment Generation Programme (PMEGP)**: Credit-linked subsidy for new micro-enterprises.\n"
                "- **Pradhan Mantri MUDRA Yojana**: Loans up to ₹10 Lakhs without collateral for micro-enterprises.\n"
                "- **Stand-Up India Scheme**: Funding up to ₹1 Crore for SC/ST and women-led enterprises."
            )
        elif "document" in last_user_msg:
            return (
                "Based on verified Maharashtra Government guidelines, required documents typically include:\n"
                "1. **Aadhaar Card** (linked to bank account for DBT).\n"
                "2. **Maharashtra Domicile Certificate** issued by Tahsildar / MahaOnline.\n"
                "3. **Tahsildar Income Certificate** (current financial year).\n"
                "4. **Caste Certificate & Validity Certificate** (for reserved categories on MahaDBT).\n"
                "5. **Land Records (7/12 & 8-A)** (for agriculture/farmer schemes) or **Bonafide / Marksheet** (for student scholarships)."
            )
        elif "eligibility" in last_user_msg or "eligible" in last_user_msg:
            return (
                "To evaluate your eligibility deterministically using our Phase 3 rules engine, please share your details:\n"
                "- **Age & Gender** (e.g. 21, Female)\n"
                "- **Category** (e.g. OBC, SC, ST, EBC, General)\n"
                "- **Annual Family Income** (e.g. ₹2,00,000)\n"
                "- **Occupation & Domicile** (e.g. Student in Maharashtra, Farmer, Entrepreneur)\n\n"
                "You can also ask directly about any scheme, e.g. *'Am I eligible for Ladki Bahin Yojana?'* or *'Eligibility for Rajarshi Shahu Maharaj scholarship'*."
            )
        elif "apply" in last_user_msg:
            return "Applications can be submitted on the official government portal (e.g., MahaDBT portal or scheme portal)."
        elif "why am i not eligible" in last_user_msg or "not eligible" in last_user_msg:
            return "You do not meet the eligibility requirements for age or annual family income."
        else:
            return "I am the Government Scheme Assistant. How can I help you find eligible schemes today?"

    async def generate_structured_output(
        self, 
        messages: list[dict[str, str]], 
        response_model: Type[T],
        system_prompt: str | None = None,
        temperature: float = 0.0
    ) -> T:
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "").lower()
                break

        model_name = response_model.__name__

        if model_name == "IntentDetectionResult":
            intent = "GENERAL_GOVERNMENT_SCHEME_QUERY"
            confidence = 0.95
            reasoning = "Rule-based mock intent classification."

            # Check greetings
            if any(last_user_msg == g or last_user_msg.startswith(g + " ") for g in ["hi", "hello", "namaste", "hey", "good morning"]):
                intent = "GREETING"
            # Check out of scope
            elif any(w in last_user_msg for w in ["capital of", "weather", "write code", "python script", "president of"]):
                intent = "OUT_OF_SCOPE"
            # Check official portal / source
            elif any(w in last_user_msg for w in ["official portal", "official website", "official link", "portal link"]):
                intent = "OFFICIAL_SOURCE_QUERY"
            # Check scheme search queries like "what scholarships...", "what schemes...", "find schemes"
            elif any(w in last_user_msg for w in ["what scholarship", "which scholarship", "what scheme", "which scheme", "list scheme", "find scheme"]):
                intent = "SCHEME_SEARCH"
            # Check why not eligible
            elif "why" in last_user_msg and ("eligible" in last_user_msg or "qualify" in last_user_msg or "rejected" in last_user_msg):
                intent = "WHY_NOT_ELIGIBLE"
            # Check eligibility
            elif any(w in last_user_msg for w in ["am i eligible", "eligibility", "do i qualify", "can i apply", "is eligible", "who is eligible", "check my eligibility"]):
                intent = "ELIGIBILITY_CHECK"
            # Check documents
            elif any(w in last_user_msg for w in ["document", "documents", "papers", "certificates", "what do i need", "what documents"]):
                intent = "DOCUMENT_QUERY"
            # Check application guidance
            elif any(w in last_user_msg for w in ["how to apply", "application procedure", "application process", "where to apply", "steps to apply", "submit application"]):
                intent = "APPLICATION_GUIDANCE"
            # Check benefits
            elif any(w in last_user_msg for w in ["benefit", "benefits", "how much money", "subsidy amount", "allowance", "financial assistance"]):
                intent = "BENEFIT_QUERY"
            # Check compare
            elif "compare" in last_user_msg or "difference between" in last_user_msg:
                intent = "COMPARE_SCHEMES"
            # Check scheme search
            elif any(w in last_user_msg for w in ["scholarship", "schemes", "find", "list", "search", "available", "farmer", "student", "women", "entrepreneur", "msme"]):
                intent = "SCHEME_SEARCH"

            return response_model(
                intent=intent,
                confidence=confidence,
                reasoning=reasoning
            )  # type: ignore

        elif model_name == "EntityExtractionResult":
            entities: dict = {}
            extracted_schemes: list[str] = []

            # 1. State extraction
            if any(w in last_user_msg for w in ["maharashtra", "mh", "mumbai", "pune", "nagpur", "nashik"]):
                entities["state_code"] = "IN-MH"
            elif "madhya pradesh" in last_user_msg or "mp" in last_user_msg:
                entities["state_code"] = "MP"
            elif "karnataka" in last_user_msg:
                entities["state_code"] = "KA"

            # 2. Occupation extraction
            if any(w in last_user_msg for w in ["farmer", "farmers", "cultivator", "shetkari"]):
                entities["occupation_type"] = "FARMER"
            elif any(w in last_user_msg for w in ["student", "students", "studying", "college", "school"]):
                entities["occupation_type"] = "STUDENT"
            elif any(w in last_user_msg for w in ["entrepreneur", "business", "msme", "startup"]):
                entities["occupation_type"] = "ENTREPRENEUR"

            # 3. Caste extraction
            if re.search(r"\b(sc|scheduled caste)\b", last_user_msg):
                entities["caste_category"] = "SC"
            elif re.search(r"\b(st|scheduled tribe|tribal)\b", last_user_msg):
                entities["caste_category"] = "ST"
            elif re.search(r"\b(obc|other backward class)\b", last_user_msg):
                entities["caste_category"] = "OBC"
            elif re.search(r"\b(ebc|economically backward)\b", last_user_msg):
                entities["caste_category"] = "EBC"
            elif re.search(r"\b(vjnt|vj|nt)\b", last_user_msg):
                entities["caste_category"] = "VJNT"

            # 4. Gender
            if any(w in last_user_msg for w in ["woman", "women", "female", "girl", "mother"]):
                entities["gender"] = "FEMALE"
            elif any(w in last_user_msg for w in ["man", "male", "boy"]):
                entities["gender"] = "MALE"

            # 5. Income extraction
            if "2 lakh" in last_user_msg or "200000" in last_user_msg:
                entities["annual_income"] = 200000
            elif "2.5 lakh" in last_user_msg or "250000" in last_user_msg:
                entities["annual_income"] = 250000
            elif "8 lakh" in last_user_msg or "800000" in last_user_msg:
                entities["annual_income"] = 800000
            elif "1.5 lakh" in last_user_msg or "150000" in last_user_msg:
                entities["annual_income"] = 150000
            elif "1 lakh" in last_user_msg or "100000" in last_user_msg:
                entities["annual_income"] = 100000

            # 6. Age extraction
            age_match = re.search(r"\b(?:age|aged)\s*(\d{1,2})\b", last_user_msg) or re.search(r"\b(\d{1,2})\s*(?:years|yr|yrs)\b", last_user_msg)
            if age_match:
                entities["age"] = int(age_match.group(1))
            elif "21" in last_user_msg:
                entities["age"] = 21
            elif "18" in last_user_msg:
                entities["age"] = 18
            elif "16" in last_user_msg:
                entities["age"] = 16
            elif "65" in last_user_msg:
                entities["age"] = 65

            # 7. Specific Scheme Extraction
            scheme_patterns = [
                (r"ladki\s*bahin", "mukhyamantri-majhi-ladki-bahin-yojana"),
                (r"namo\s*shetkari", "namo-shetkari-mahasanman-nidhi-yojana"),
                (r"pm[- ]?kisan", "pm-kisan-samman-nidhi-maharashtra"),
                (r"ebc|shahu\s*maharaj", "rajarshi-chhatrapati-shahu-maharaj-ebc-scholarship"),
                (r"swadhar", "dr-babasaheb-ambedkar-swadhar-yojana"),
                (r"panjabrao|vasatgruh", "dr-panjabrao-deshmukh-vasatgruh-nirvah-bhatta"),
                (r"mjpjay|jyotirao\s*phule", "mahatma-jyotirao-phule-jan-arogya-yojana-mjpjay"),
                (r"ayushman|pm[- ]?jay", "ayushman-bharat-pm-jay-maharashtra"),
                (r"sanjay\s*gandhi", "sanjay-gandhi-niradhar-anudan-yojana"),
                (r"shravanbal", "shravanbal-seva-rajya-nivruttivetan-yojana"),
                (r"cmegp", "chief-minister-employment-generation-programme-cmegp"),
                (r"ramai", "ramai-awas-yojana-maharashtra"),
                (r"shabari", "shabari-adivasi-gharkul-yojana"),
                (r"pmay|awas\s*yojana", "pradhan-mantri-awas-yojana-urban-maharashtra"),
                (r"fasal\s*bima|crop\s*insurance", "pm-fasal-bima-yojana-maharashtra-one-rupee"),
                (r"savitribai", "savitribai-phule-kanya-kalyani-yojana"),
                (r"eklavya", "eklavya-scholarship-scheme-maharashtra"),
                (r"magel\s*tyala|farm\s*pond", "magel-tyala-shet-tale-yojana-maharashtra"),
                (r"yantrikikaran|mechanization", "mahadbt-krishi-yantrikikaran-yojna"),
                (r"lek\s*ladki", "lek-ladki-yojana-maharashtra"),
                (r"krushi\s*swavalamban", "dr-babasaheb-ambedkar-krushi-swavalamban-yojana"),
                (r"birsa\s*munda", "birsa-munda-krishi-kranti-yojana"),
            ]

            for pat, slug in scheme_patterns:
                if re.search(pat, last_user_msg):
                    extracted_schemes.append(slug)
                    break

            # If user query directly contains words matching existing test schemes
            if "scheme with documents" in last_user_msg:
                extracted_schemes.append("SCHEME WITH DOCUMENTS")
            elif "scheme with application process" in last_user_msg:
                extracted_schemes.append("SCHEME WITH APPLICATION PROCESS")
            elif "test scholarship for eligibility" in last_user_msg:
                extracted_schemes.append("TEST SCHOLARSHIP FOR ELIGIBILITY")
            elif "income scheme" in last_user_msg:
                extracted_schemes.append("TEST INCOME SCHEME")
            elif "strict age scheme" in last_user_msg:
                extracted_schemes.append("TEST STRICT AGE SCHEME")

            return response_model(
                entities=entities,
                extracted_scheme_names=extracted_schemes,
                unrecognized_parameters=[]
            )  # type: ignore

        # Default fallback instantiation
        try:
            return response_model()  # type: ignore
        except Exception:
            field_defaults = {}
            for field_name, field in response_model.model_fields.items():
                if field.annotation is str:
                    field_defaults[field_name] = "MOCK_VALUE"
                elif field.annotation is int or field.annotation is float:
                    field_defaults[field_name] = 0
                elif field.annotation is list:
                    field_defaults[field_name] = []
                elif field.annotation is dict:
                    field_defaults[field_name] = {}
                else:
                    field_defaults[field_name] = None
            return response_model(**field_defaults)

    async def generate_embedding(self, text: str) -> list[float]:
        """
        Generate a deterministic 1536-dimensional mock embedding vector.
        Uses MD5 hash projection to ensure identical text yields identical vectors
        and different texts produce distinguishable, non-zero embeddings.
        """
        hash_digest = hashlib.md5(text.encode("utf-8")).digest()
        # Seed pseudo-random values deterministically from hash bytes
        base_vals = [float(b) / 255.0 for b in hash_digest]
        vector = (base_vals * 96)[:1536]  # 16 * 96 = 1536
        # Normalize
        norm = sum(x * x for x in vector) ** 0.5
        if norm > 0:
            vector = [x / norm for x in vector]
        return vector
