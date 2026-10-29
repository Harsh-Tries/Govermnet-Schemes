import urllib.request
import json
import pytest

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_bookmark_api_live_lifecycle():
    user_id = "test-live-citizen"
    scheme_id = "09288555-2b4a-4671-ad3f-d3bd53a99474"

    # 1. Clean initial state
    try:
        req = urllib.request.Request(f"{BASE_URL}/bookmarks/{scheme_id}?user_id={user_id}", method="DELETE")
        urllib.request.urlopen(req)
    except Exception:
        pass

    # 2. Check initial IDs
    res = json.loads(urllib.request.urlopen(f"{BASE_URL}/bookmarks/ids?user_id={user_id}").read())
    assert scheme_id not in res

    # 3. Add bookmark
    payload = json.dumps({"scheme_id": scheme_id, "user_id": user_id}).encode()
    add_req = urllib.request.Request(
        f"{BASE_URL}/bookmarks",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    add_res = json.loads(urllib.request.urlopen(add_req).read())
    assert add_res["success"] is True
    assert add_res["bookmarked"] is True

    # 4. Check IDs now contains scheme
    ids_res = json.loads(urllib.request.urlopen(f"{BASE_URL}/bookmarks/ids?user_id={user_id}").read())
    assert scheme_id in ids_res

    # 5. List schemes
    list_res = json.loads(urllib.request.urlopen(f"{BASE_URL}/bookmarks?user_id={user_id}").read())
    assert len(list_res) >= 1
    assert any(s["id"] == scheme_id for s in list_res)

    # 6. Delete bookmark
    del_req = urllib.request.Request(f"{BASE_URL}/bookmarks/{scheme_id}?user_id={user_id}", method="DELETE")
    del_res = json.loads(urllib.request.urlopen(del_req).read())
    assert del_res["success"] is True
    assert del_res["bookmarked"] is False

    # 7. Verify removed
    final_ids = json.loads(urllib.request.urlopen(f"{BASE_URL}/bookmarks/ids?user_id={user_id}").read())
    assert scheme_id not in final_ids
