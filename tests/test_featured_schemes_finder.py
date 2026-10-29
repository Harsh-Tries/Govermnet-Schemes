"""
Automated tests for Featured Maharashtra Government Schemes Finder.
Verifies:
1. Retrieval of published schemes with Maharashtra STATE prioritization by default.
2. Filtering by top-level citizen categories (Students, Farmers, MSME, PwD).
3. Filtering by Government Level (STATE, CENTRALLY_SPONSORED, CENTRAL).
4. Sorting options (state_first, name_asc, name_desc, recently_verified).
5. Keyword search matching titles and descriptions.
6. Full bookmarking lifecycle (get IDs, add bookmark, duplicate prevention, remove bookmark).
7. Exclusion of non-published (draft/archived) schemes from the public finder.
"""

import sys
import os
import pytest
from sqlalchemy.orm import Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.models import Scheme, User, UserBookmark
from app.enums import SchemeStatus, GovernmentLevel, SchemeType
from database.seeds.maharashtra_schemes import seed_maharashtra_knowledge_base
from app.api.v1.endpoints.schemes import list_schemes, get_scheme_by_id
from app.api.v1.endpoints.bookmarks import (
    list_bookmarked_schemes,
    list_bookmarked_scheme_ids,
    add_bookmark,
    remove_bookmark,
    BookmarkToggleRequest
)


@pytest.fixture(autouse=True)
def seed_catalog(db_session: Session):
    """Seed the Maharashtra knowledge base before each test."""
    seed_maharashtra_knowledge_base(db_session)
    # Ensure demo user exists for bookmark tests
    user = db_session.query(User).filter(User.id == "demo-citizen-user").first()
    if not user:
        demo_user = User(
            id="demo-citizen-user",
            email="rohan.sharma@example.gov.in",
            role="CITIZEN",
            is_active=True
        )
        db_session.add(demo_user)
        db_session.commit()


def test_public_schemes_default_prioritizes_maharashtra_state(db_session: Session):
    """list_schemes endpoint should return published schemes with Maharashtra STATE schemes first."""
    schemes = list_schemes(db=db_session)
    assert len(schemes) >= 20

    # All returned schemes must be PUBLISHED
    for s in schemes:
        assert s.status == SchemeStatus.PUBLISHED

    # Default sort_by=state_first must place STATE schemes at the start
    first_scheme = schemes[0]
    assert first_scheme.government_level == GovernmentLevel.STATE, (
        f"Expected STATE scheme first, got {first_scheme.government_level}"
    )


def test_category_and_beneficiary_tabs_filtering(db_session: Session):
    """Verify category/beneficiary tabs for Students, Farmers, MSME, and PwD return relevant schemes."""
    # 1. Students filter
    student_schemes = list_schemes(beneficiary_id="STUDENT", db=db_session)
    assert len(student_schemes) > 0
    student_names = [s.name for s in student_schemes]
    assert any("Scholarship" in n or "Shikshan Shulkh" in n or "Swadhar" in n for n in student_names)

    # 2. Farmers filter
    farmer_schemes = list_schemes(beneficiary_id="FARMER", db=db_session)
    assert len(farmer_schemes) > 0
    farmer_names = [s.name for s in farmer_schemes]
    assert any("Namo Shetkari" in n or "PM-KISAN" in n or "Krishi" in n for n in farmer_names)

    # 3. MSME / Entrepreneur filter
    msme_schemes = list_schemes(beneficiary_id="ENTREPRENEUR", db=db_session)
    assert len(msme_schemes) > 0
    msme_names = [s.name for s in msme_schemes]
    assert any("Employment Generation" in n or "CMEGP" in n for n in msme_names)

    # 4. PwD / Divyang filter
    pwd_schemes = list_schemes(beneficiary_id="PWD", db=db_session)
    assert len(pwd_schemes) > 0
    pwd_names = [s.name for s in pwd_schemes]
    assert any("Niradhar" in n or "Disabled" in n or "Divyang" in s.short_description for s in pwd_schemes for n in [s.name])


def test_jurisdiction_level_filtering(db_session: Session):
    """Verify filtering strictly by STATE, CENTRALLY_SPONSORED, and CENTRAL levels."""
    # State schemes
    state_schemes = list_schemes(government_level=GovernmentLevel.STATE, db=db_session)
    assert len(state_schemes) >= 10
    assert all(s.government_level == GovernmentLevel.STATE for s in state_schemes)

    # Centrally Sponsored schemes
    cs_schemes = list_schemes(government_level=GovernmentLevel.CENTRALLY_SPONSORED, db=db_session)
    assert len(cs_schemes) > 0
    assert all(s.government_level == GovernmentLevel.CENTRALLY_SPONSORED for s in cs_schemes)

    # Central schemes
    central_schemes = list_schemes(government_level=GovernmentLevel.CENTRAL, db=db_session)
    assert len(central_schemes) > 0
    assert all(s.government_level == GovernmentLevel.CENTRAL for s in central_schemes)


def test_sorting_functionality(db_session: Session):
    """Verify sorting modes: name_asc, name_desc, recently_verified."""
    # Name Ascending
    schemes_asc = list_schemes(sort_by="name_asc", db=db_session)
    names_asc = [s.name for s in schemes_asc]
    assert names_asc == sorted(names_asc, key=lambda x: x.lower())

    # Name Descending
    schemes_desc = list_schemes(sort_by="name_desc", db=db_session)
    names_desc = [s.name for s in schemes_desc]
    assert names_desc == sorted(names_desc, key=lambda x: x.lower(), reverse=True)

    # Recently Verified
    schemes_verified = list_schemes(sort_by="recently_verified", db=db_session)
    assert len(schemes_verified) > 0


def test_keyword_search(db_session: Session):
    """Verify keyword search matches scheme title, slug, or description."""
    results_ladki = list_schemes(search="Ladki", db=db_session)
    assert len(results_ladki) > 0
    assert any("Ladki" in s.name for s in results_ladki)

    results_kisan = list_schemes(search="Kisan", db=db_session)
    assert len(results_kisan) > 0
    assert any("Kisan" in s.name or "Shetkari" in s.name for s in results_kisan)


def test_bookmark_lifecycle_and_persistence(db_session: Session):
    """Test full bookmark workflow: GET IDs, POST bookmark, idempotence, and DELETE bookmark."""
    # 1. Fetch available schemes to get a valid scheme_id
    schemes = list_schemes(db=db_session)
    assert len(schemes) > 0
    target_scheme = schemes[0]
    target_id = target_scheme.id

    # 2. Initially bookmarks IDs should not contain target_id
    initial_ids = list_bookmarked_scheme_ids(user_id="demo-citizen-user", db=db_session)
    assert target_id not in initial_ids

    # 3. Add bookmark
    add_req = BookmarkToggleRequest(scheme_id=target_id, user_id="demo-citizen-user")
    add_res = add_bookmark(payload=add_req, db=db_session)
    assert add_res.bookmarked is True
    assert add_res.scheme_id == target_id

    # 4. Check IDs contains target_id
    current_ids = list_bookmarked_scheme_ids(user_id="demo-citizen-user", db=db_session)
    assert target_id in current_ids

    # 5. Idempotent add should succeed gracefully without creating duplicate entries
    add_dup_res = add_bookmark(payload=add_req, db=db_session)
    assert add_dup_res.bookmarked is True
    assert add_dup_res.message == "Scheme is already bookmarked."
    dup_count = db_session.query(UserBookmark).filter(
        UserBookmark.user_id == "demo-citizen-user",
        UserBookmark.scheme_id == target_id
    ).count()
    assert dup_count == 1

    # 6. Full bookmarks endpoint returns the populated scheme object
    bookmarked_schemes = list_bookmarked_schemes(user_id="demo-citizen-user", db=db_session)
    assert any(s.id == target_id for s in bookmarked_schemes)

    # 7. Remove bookmark
    del_res = remove_bookmark(scheme_id=target_id, user_id="demo-citizen-user", db=db_session)
    assert del_res.bookmarked is False

    # 8. Check IDs no longer contains target_id
    final_ids = list_bookmarked_scheme_ids(user_id="demo-citizen-user", db=db_session)
    assert target_id not in final_ids


def test_draft_and_archived_schemes_excluded_from_public_feed(db_session: Session):
    """Ensure non-published schemes (e.g. DRAFT or ARCHIVED) are never leaked in the public feed."""
    # Create a draft scheme
    draft_scheme = Scheme(
        name="Internal Draft Scheme 2026",
        slug="internal-draft-scheme-2026",
        short_description="Draft internal government document",
        government_level=GovernmentLevel.STATE,
        scheme_type=SchemeType.SUBSIDY,
        status=SchemeStatus.DRAFT
    )
    db_session.add(draft_scheme)
    db_session.commit()

    # Query public feed
    results_public = list_schemes(search="Internal Draft", db=db_session)
    assert len(results_public) == 0

    # Query admin feed with include_all_statuses=True
    results_admin = list_schemes(search="Internal Draft", include_all_statuses=True, db=db_session)
    assert len(results_admin) == 1
    assert results_admin[0].slug == "internal-draft-scheme-2026"
