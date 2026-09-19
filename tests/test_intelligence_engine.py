import pytest
from app.models import Scheme, EligibilityRuleGroup, EligibilityRule, SchemeCategory, BeneficiaryType, OfficialSource, SchemeSource
from app.enums import GovernmentLevel, SchemeType, SchemeStatus, RuleOperator
from app.schemas.intelligence import OverallEligibilityStatus
from app.services.eligibility.evaluator import DeterministicEligibilityEvaluator
from app.services.eligibility.explanation import ExplanationGenerator
from app.services.eligibility.validator import RuleValidator, RuleValidationError

def test_rule_validator_type_checks():
    # Valid numeric comparison
    assert RuleValidator.validate_rule("age", RuleOperator.GREATER_THAN_OR_EQUAL, 18) == True

    # Invalid numeric comparison with string
    with pytest.raises(RuleValidationError):
        RuleValidator.validate_rule("annual_income", RuleOperator.GREATER_THAN, "abc")

    # Invalid boolean operator
    with pytest.raises(RuleValidationError):
        RuleValidator.validate_rule("is_pwd", RuleOperator.GREATER_THAN, True)

def test_demo_student_scheme_cases(db_session):
    # Setup DEMO STUDENT SCHEME
    scheme = Scheme(
        name="DEMO STUDENT SCHEME FOR TEST",
        slug="demo-student-scheme-test",
        short_description="Short summary for student test scheme",
        government_level=GovernmentLevel.CENTRAL,
        scheme_type=SchemeType.SCHOLARSHIP,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    # Rule Group: age >= 18 AND student_status = true AND state = IN-MP AND annual_income <= 250000
    grp = EligibilityRuleGroup(scheme_id=scheme.id, logical_operator="AND")
    db_session.add(grp)
    db_session.commit()

    db_session.add_all([
        EligibilityRule(group_id=grp.id, parameter_name="age", operator=RuleOperator.GREATER_THAN_OR_EQUAL, comparison_value=18),
        EligibilityRule(group_id=grp.id, parameter_name="student_status", operator=RuleOperator.EQUALS, comparison_value=True),
        EligibilityRule(group_id=grp.id, parameter_name="state", operator=RuleOperator.EQUALS, comparison_value="IN-MP"),
        EligibilityRule(group_id=grp.id, parameter_name="annual_income", operator=RuleOperator.LESS_THAN_OR_EQUAL, comparison_value=250000)
    ])
    db_session.commit()

    # CASE 1: Age 21, Student true, MP, Income 180000 -> ELIGIBLE
    profile1 = {"age": 21, "student_status": True, "state": "IN-MP", "annual_income": 180000}
    res1 = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile1)
    res1.explanations = ExplanationGenerator.generate_explanations(res1)
    assert res1.status == OverallEligibilityStatus.ELIGIBLE
    assert len(res1.satisfied_conditions) == 4
    assert len(res1.failed_conditions) == 0
    assert len(res1.missing_information) == 0

    # CASE 2: Age 16, Student true, MP, Income 180000 -> NOT_ELIGIBLE (Failed age)
    profile2 = {"age": 16, "student_status": True, "state": "IN-MP", "annual_income": 180000}
    res2 = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile2)
    res2.explanations = ExplanationGenerator.generate_explanations(res2)
    assert res2.status == OverallEligibilityStatus.NOT_ELIGIBLE
    assert len(res2.failed_conditions) == 1
    assert res2.failed_conditions[0].parameter == "age"

    # CASE 3: Age 21, Student true, MP, Income missing -> UNKNOWN (Missing income)
    profile3 = {"age": 21, "student_status": True, "state": "IN-MP"}
    res3 = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile3)
    res3.explanations = ExplanationGenerator.generate_explanations(res3)
    assert res3.status == OverallEligibilityStatus.UNKNOWN
    assert "annual_income" in res3.missing_information

    # CASE 4: Age 21, Student false, MP, Income 180000 -> NOT_ELIGIBLE (Failed student)
    profile4 = {"age": 21, "student_status": False, "state": "IN-MP", "annual_income": 180000}
    res4 = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile4)
    assert res4.status == OverallEligibilityStatus.NOT_ELIGIBLE
    assert res4.failed_conditions[0].parameter == "student_status"

    # CASE 5: Age missing, Student true, MP, Income 180000 -> UNKNOWN (Missing age)
    profile5 = {"student_status": True, "state": "IN-MP", "annual_income": 180000}
    res5 = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile5)
    assert res5.status == OverallEligibilityStatus.UNKNOWN
    assert "age" in res5.missing_information

def test_or_logic_and_nested_groups(db_session):
    scheme = Scheme(
        name="OR Logic Test Scheme",
        slug="or-logic-scheme",
        short_description="OR logic testing",
        government_level=GovernmentLevel.CENTRAL,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    # Rule Group: age >= 18 AND (annual_income <= 250000 OR category IN ["SC", "ST"])
    parent_grp = EligibilityRuleGroup(scheme_id=scheme.id, logical_operator="AND")
    db_session.add(parent_grp)
    db_session.commit()

    db_session.add(EligibilityRule(group_id=parent_grp.id, parameter_name="age", operator=RuleOperator.GREATER_THAN_OR_EQUAL, comparison_value=18))

    child_grp = EligibilityRuleGroup(scheme_id=scheme.id, logical_operator="OR", parent_group_id=parent_grp.id)
    db_session.add(child_grp)
    db_session.commit()

    db_session.add_all([
        EligibilityRule(group_id=child_grp.id, parameter_name="annual_income", operator=RuleOperator.LESS_THAN_OR_EQUAL, comparison_value=250000),
        EligibilityRule(group_id=child_grp.id, parameter_name="caste_category", operator=RuleOperator.IN, comparison_value=["SC", "ST"])
    ])
    db_session.commit()

    # User 1: Income 300k (fails income), but SC category (satisfies OR child) -> ELIGIBLE
    res1 = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, {"age": 20, "annual_income": 300000, "caste_category": "SC"})
    assert res1.status == OverallEligibilityStatus.ELIGIBLE

    # User 2: Income 300k, General category -> NOT_ELIGIBLE (both OR branches fail)
    res2 = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, {"age": 20, "annual_income": 300000, "caste_category": "GENERAL"})
    assert res2.status == OverallEligibilityStatus.NOT_ELIGIBLE

def test_scheme_without_explicit_rules_returns_unknown(db_session):
    scheme = Scheme(
        name="Scheme Without Rules",
        slug="no-rules-scheme",
        short_description="No rules attached",
        government_level=GovernmentLevel.CENTRAL,
        status=SchemeStatus.PUBLISHED
    )
    db_session.add(scheme)
    db_session.commit()

    res = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, {"age": 25})
    assert res.status == OverallEligibilityStatus.UNKNOWN
    assert "Structured eligibility rules are unavailable." in res.missing_information

def test_multi_scheme_matching_api(client, db_session):
    # Seed 1 Published Scheme & 1 Draft Scheme
    cat = SchemeCategory(code="EDU", name="Education")
    ben = BeneficiaryType(code="STU", name="Student")
    db_session.add_all([cat, ben])
    db_session.commit()

    s1 = Scheme(name="Published Scheme", slug="pub-1", short_description="Pub desc", status=SchemeStatus.PUBLISHED)
    s2 = Scheme(name="Draft Scheme", slug="draft-1", short_description="Draft desc", status=SchemeStatus.DRAFT)
    db_session.add_all([s1, s2])
    db_session.commit()

    res = client.post("/api/v1/matching", json={"age": 20, "student_status": True})
    assert res.status_code == 200
    data = res.json()
    
    # Public matching should only return published scheme
    all_matched_ids = [s["scheme_id"] for s in data["eligible_schemes"] + data["unknown_schemes"] + data["not_eligible_schemes"]]
    assert s1.id in all_matched_ids
    assert s2.id not in all_matched_ids
