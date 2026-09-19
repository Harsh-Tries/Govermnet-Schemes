def test_create_and_get_scheme(client):
    payload = {
        "name": "API Test Scheme",
        "slug": "api-test-scheme",
        "short_description": "Comprehensive short description for test scheme",
        "description": "Full details description",
        "government_level": "CENTRAL",
        "scheme_type": "GRANT"
    }

    res = client.post("/api/v1/schemes", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "API Test Scheme"
    assert data["status"] == "DRAFT"

    scheme_id = data["id"]
    
    # Public list should NOT include draft scheme
    pub_res = client.get("/api/v1/schemes")
    assert pub_res.status_code == 200
    assert len(pub_res.json()) == 0

    # Admin list WITH include_all_statuses SHOULD return it
    admin_res = client.get("/api/v1/schemes?include_all_statuses=true")
    assert admin_res.status_code == 200
    assert len(admin_res.json()) == 1

def test_scheme_text_search(client):
    client.post("/api/v1/schemes", json={
        "name": "Scholarship for Computer Science Students",
        "slug": "cs-scholarship",
        "short_description": "Covers tuition for tech degrees",
        "government_level": "CENTRAL"
    })

    client.post("/api/v1/schemes", json={
        "name": "Farmer Drip Irrigation Scheme",
        "slug": "farmer-drip",
        "short_description": "Water management subsidy for agriculture",
        "government_level": "STATE"
    })

    search_res = client.get("/api/v1/schemes?include_all_statuses=true&search=Scholarship")
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) == 1
    assert results[0]["slug"] == "cs-scholarship"
