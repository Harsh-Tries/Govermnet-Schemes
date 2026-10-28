"""
Automated tests for Phase 2: Genuine Maharashtra Government Scheme Knowledge Base.
Verifies scheme volume, taxonomy coverage, official source authenticity,
relational integrity, and non-destructive demo data archival.
"""

import sys
import os
import pytest
from sqlalchemy.orm import Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.models import (
    Scheme, SchemeCategoryMap, SchemeBeneficiary,
    SchemeBenefit, SchemeDocument, OfficialSource, SchemeSource,
    ApplicationProcess, CitizenApplication
)
from app.enums import SchemeStatus, GovernmentLevel
from database.seeds.maharashtra_schemes import seed_maharashtra_knowledge_base, MAHARASHTRA_SCHEMES_DATA
from app.db.session import SessionLocal


class TestMaharashtraSchemeKnowledgeBase:
    """Tests the Maharashtra Scheme knowledge base catalog and seeding logic."""

    def test_seeder_populates_at_least_20_genuine_schemes(self, db_session: Session):
        """Verify that running the seeder creates at least 20 genuine published schemes."""
        stats = seed_maharashtra_knowledge_base(db_session)
        
        # Verify seeder stats
        assert stats["total_genuine"] >= 20, f"Expected >= 20 genuine schemes, got {stats['total_genuine']}"
        assert stats["inserted"] >= 20

        # Verify DB records
        published_schemes = db_session.query(Scheme).filter(
            Scheme.status == SchemeStatus.PUBLISHED
        ).all()
        assert len(published_schemes) >= 20

    def test_published_schemes_have_valid_official_sources(self, db_session: Session):
        """Verify that every published scheme contains official traceable government URLs (.gov.in or .nic.in)."""
        seed_maharashtra_knowledge_base(db_session)
        
        schemes = db_session.query(Scheme).filter(
            Scheme.status == SchemeStatus.PUBLISHED
        ).all()

        for scheme in schemes:
            assert scheme.sources, f"Scheme {scheme.slug} has no official sources attached"
            for scheme_source in scheme.sources:
                url = scheme_source.source.url.lower()
                is_gov = (
                    "gov.in" in url or 
                    "nic.in" in url or 
                    "maharashtra.gov.in" in url or
                    "pmkisan.gov.in" in url or
                    "pmfby.gov.in" in url or
                    "jeevandayee.gov.in" in url
                )
                assert is_gov, f"Scheme {scheme.slug} has non-government source: {url}"

    def test_all_published_schemes_have_administering_ministry(self, db_session: Session):
        """Verify that every published scheme specifies an authentic administering ministry."""
        seed_maharashtra_knowledge_base(db_session)
        
        schemes = db_session.query(Scheme).filter(
            Scheme.status == SchemeStatus.PUBLISHED
        ).all()

        for scheme in schemes:
            assert scheme.administering_ministry, f"Scheme {scheme.slug} is missing administering_ministry"
            assert len(scheme.administering_ministry.strip()) > 3

    def test_demo_schemes_are_archived_and_not_public(self, db_session: Session):
        """Verify that fictional demo records are archived and not listed in published status."""
        # Insert a demo scheme first
        demo = Scheme(
            name="DEMO HIGHER EDUCATION SCHOLARSHIP 2026",
            slug="demo-higher-education-scholarship-2026",
            short_description="Demo fictional record",
            status=SchemeStatus.PUBLISHED
        )
        db_session.add(demo)
        db_session.commit()

        # Run seeder
        seed_maharashtra_knowledge_base(db_session)

        # Check that demo scheme is now ARCHIVED
        archived = db_session.query(Scheme).filter(
            Scheme.slug == "demo-higher-education-scholarship-2026"
        ).first()
        assert archived is not None
        assert archived.status == SchemeStatus.ARCHIVED

        # Verify no published scheme contains 'DEMO' or 'fictional'
        published = db_session.query(Scheme).filter(
            Scheme.status == SchemeStatus.PUBLISHED
        ).all()
        for p in published:
            assert "DEMO" not in p.name.upper(), f"Published scheme {p.slug} contains DEMO in name"
            assert "demo-" not in p.slug.lower(), f"Published scheme {p.slug} has demo slug"

    def test_seeder_is_idempotent(self, db_session: Session):
        """Verify that running the seeder multiple times does not duplicate schemes."""
        stats1 = seed_maharashtra_knowledge_base(db_session)
        count_first_run = db_session.query(Scheme).count()

        stats2 = seed_maharashtra_knowledge_base(db_session)
        count_second_run = db_session.query(Scheme).count()

        assert count_first_run == count_second_run
        assert stats2["inserted"] == 0
        assert stats2["updated"] == stats1["total_genuine"]

    def test_scheme_benefit_and_document_relations(self, db_session: Session):
        """Verify that child benefits and documents are properly attached to seeded schemes."""
        seed_maharashtra_knowledge_base(db_session)
        
        # Test a representative scheme (e.g. Majhi Ladki Bahin)
        ladki_bahin = db_session.query(Scheme).filter(
            Scheme.slug == "mukhyamantri-majhi-ladki-bahin-yojana"
        ).first()
        assert ladki_bahin is not None
        assert len(ladki_bahin.benefits) >= 1
        assert ladki_bahin.benefits[0].amount == 18000.0
        assert len(ladki_bahin.documents) >= 4

        # Test PM-KISAN
        pm_kisan = db_session.query(Scheme).filter(
            Scheme.slug == "pm-kisan-samman-nidhi-maharashtra"
        ).first()
        assert pm_kisan is not None
        assert len(pm_kisan.benefits) >= 1
        assert pm_kisan.benefits[0].amount == 6000.0

    def test_real_sqlite_database_state(self):
        """Directly queries canonical project SQLite database to verify persistence."""
        db = SessionLocal()
        try:
            published_schemes = db.query(Scheme).filter(
                Scheme.status == SchemeStatus.PUBLISHED
            ).all()
            assert len(published_schemes) >= 20, f"Expected >= 20 published schemes in DB, found {len(published_schemes)}"
            
            # Check demo scheme status in canonical DB
            demo_schemes = db.query(Scheme).filter(
                Scheme.slug.in_(["demo-higher-education-scholarship-2026", "demo-farmer-drip-irrigation-2026"])
            ).all()
            for ds in demo_schemes:
                assert ds.status == SchemeStatus.ARCHIVED, f"Demo scheme {ds.slug} should be ARCHIVED"

            # Check foreign key to citizen applications
            apps = db.query(CitizenApplication).all()
            for app in apps:
                linked = db.query(Scheme).filter(Scheme.id == app.scheme_id).first()
                assert linked is not None, f"Application {app.application_reference} has dangling scheme_id"
        finally:
            db.close()
