def test_verification_lifecycle_and_publication(client):
    # 1. Create Category, Beneficiary, Source
    cat_res = client.post("/api/v1/categories", json={"code": "EDU", "name": "Education"})
    cat_id = cat_res.json()["id"]

    ben_res = client.post("/api/v1/beneficiaries", json={"code": "STU", "name": "Student"})
    ben_id = ben_res.json()["id"]

    src_res = client.post("/api/v1/sources", json={
        "url": "https://scholarships.gov.in/policy",
        "source_type": "OFFICIAL_PORTAL",
        "authority": "Ministry of Education",
        "title": "Official Scholarship Policy"
    })
    src_id = src_res.json()["id"]

    # 2. Create Scheme in DRAFT
    scheme_res = client.post("/api/v1/schemes", json={
        "name": "Lifecycle Verification Scheme",
        "slug": "lifecycle-scheme",
        "short_description": "Testing lifecycle transition restrictions",
        "category_ids": [cat_id],
        "beneficiary_type_ids": [ben_id]
    })
    scheme_id = scheme_res.json()["id"]

    # Attach Source
    client.post(f"/api/v1/schemes/{scheme_id}/sources", json={"source_id": src_id})

    # 3. Attempt PUBLISH directly from DRAFT (Should fail publishability validation)
    pub_fail_res = client.post(f"/api/v1/verification/schemes/{scheme_id}", json={
        "action": "PUBLISH",
        "notes": "Premature publish attempt"
    })
    assert pub_fail_res.status_code == 422
    assert "Scheme must undergo source verification" in pub_fail_res.json()["detail"]

    # 4. Perform valid lifecycle: SUBMIT -> VERIFY_SOURCE -> PUBLISH
    submit_res = client.post(f"/api/v1/verification/schemes/{scheme_id}", json={"action": "SUBMIT"})
    assert submit_res.status_code == 200
    assert submit_res.json()["verification_status"] == "UNDER_REVIEW"

    verify_res = client.post(f"/api/v1/verification/schemes/{scheme_id}", json={
        "action": "VERIFY_SOURCE",
        "source_reviewed": "https://scholarships.gov.in/policy",
        "notes": "Source confirmed active"
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["verification_status"] == "SOURCE_VERIFIED"

    publish_res = client.post(f"/api/v1/verification/schemes/{scheme_id}", json={"action": "PUBLISH"})
    assert publish_res.status_code == 200
    assert publish_res.json()["verification_status"] == "PUBLISHED"

    # 5. Check public listing now includes published scheme
    public_list = client.get("/api/v1/schemes")
    assert public_list.status_code == 200
    assert len(public_list.json()) == 1
    assert public_list.json()[0]["id"] == scheme_id
