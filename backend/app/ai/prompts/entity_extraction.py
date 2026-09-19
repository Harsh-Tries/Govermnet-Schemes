ENTITY_EXTRACTION_PROMPT = """
Extract structured socio-demographic parameters and scheme names from the user's natural language input.

Known parameters:
- age (integer)
- state_code (string, e.g. MP, MH, KA, DL)
- district_name (string)
- annual_income (number)
- caste_category (GENERAL, OBC, SC, ST, EWS)
- occupation_type (STUDENT, FARMER, ENTREPRENEUR, JOB_SEEKER, ARTISAN)
- is_pwd (boolean)
- gender (MALE, FEMALE, OTHER)

Map extracted parameters to these exact field names.
Do not invent dynamic parameter names.
"""
