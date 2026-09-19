def test_eligibility_parameter_and_rule_storage(client):
    # 1. Create parameter
    param_res = client.post("/api/v1/eligibility-parameters", json={
        "name": "annual_income",
        "display_name": "Annual Income",
        "data_type": "FLOAT",
        "category": "SOCIOECONOMIC",
        "unit": "INR"
    })
    assert param_res.status_code == 201

    # 2. Create Scheme
    scheme_res = client.post("/api/v1/schemes", json={
        "name": "Rule Storage Scheme",
        "slug": "rule-storage-scheme",
        "short_description": "Testing rule storage structure"
    })
    scheme_id = scheme_res.json()["id"]

    # 3. Create Rule Group
    rule_payload = {
        "logical_operator": "AND",
        "rules": [
            {
                "parameter_name": "annual_income",
                "operator": "LESS_THAN_OR_EQUAL",
                "comparison_value": 250000,
                "is_mandatory": True,
                "failure_message": "Income exceeds threshold"
            }
        ]
    }

    rule_res = client.post(f"/api/v1/schemes/{scheme_id}/eligibility-rules", json=rule_payload)
    assert rule_res.status_code == 201
    r_data = rule_res.json()
    assert r_data["scheme_id"] == scheme_id
    assert len(r_data["rules"]) == 1
    assert r_data["rules"][0]["parameter_name"] == "annual_income"
    assert r_data["rules"][0]["comparison_value"] == 250000
