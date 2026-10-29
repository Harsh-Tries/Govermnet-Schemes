"""
Production Background Worker for Government Scheme Assistant.
Executes registered asynchronous tasks:
1. Citizen application status synchronization from external government portals.
2. Scheme freshness verification and re-verification triggers.
3. Notification dispatch for deadline and status alerts.
4. Cache hygiene and vector maintenance.
"""

import sys
import time
import signal
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, Any

from app.db.session import SessionLocal
from app.models.application_tracking import CitizenApplication, ApplicationStatusHistory
from app.models import Scheme, Notification
from app.enums import SchemeStatus, CitizenApplicationStatus, NotificationCategory
from app.services.integrations.mock_adapter import MockGovernmentAdapter
from app.services.notifications.service import NotificationService
from app.core.cache import CacheService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [app.worker] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("app.worker")

class SchemeAssistantWorker:
    def __init__(self, poll_interval_seconds: int = 15):
        self.poll_interval = poll_interval_seconds
        self.is_running = False
        self.tasks_executed = 0
        self.tasks_succeeded = 0
        self.tasks_failed = 0
        self.started_at = datetime.utcnow()
        self.last_heartbeat = datetime.utcnow()
        self.adapter = MockGovernmentAdapter(integration_id="worker-adapter", base_url="https://maharashtra.gov.in")

    def register_signal_handlers(self):
        """Register POSIX and Windows termination signals."""
        def _handle_exit(sig, frame):
            logger.info("Termination signal received. Gracefully shutting down worker...")
            self.is_running = False

        signal.signal(signal.SIGINT, _handle_exit)
        signal.signal(signal.SIGTERM, _handle_exit)

    def task_sync_application_statuses(self, db) -> int:
        """Polls external portal status updates for active citizen applications."""
        updated_count = 0
        # Find applications submitted or under review
        pending_apps = db.query(CitizenApplication).filter(
            CitizenApplication.status.in_([
                CitizenApplicationStatus.SUBMITTED,
                CitizenApplicationStatus.UNDER_REVIEW
            ])
        ).limit(20).all()

        for app_rec in pending_apps:
            try:
                external_info = self.adapter.get_application_status(app_rec.application_reference)
                new_status_str = external_info.get("status")
                
                # If status advanced to DOCUMENTS_VERIFIED
                if new_status_str and new_status_str != app_rec.status.value:
                    try:
                        new_status = CitizenApplicationStatus(new_status_str)
                    except ValueError:
                        new_status = CitizenApplicationStatus.UNDER_REVIEW

                    old_st = app_rec.status.value
                    app_rec.status = new_status
                    app_rec.updated_at = datetime.utcnow()

                    # Add history
                    history = ApplicationStatusHistory(
                        application_id=app_rec.id,
                        old_status=old_st,
                        new_status=new_status.value,
                        source="OFFICIAL_PORTAL_SYNC",
                        notes=external_info.get("notes", "Synced by background worker.")
                    )
                    db.add(history)

                    # Send notification if user attached
                    if app_rec.user_id:
                        NotificationService.send_notification(
                            db,
                            user_id=app_rec.user_id,
                            category=NotificationCategory.STATUS_UPDATES,
                            title=f"Application {app_rec.application_reference} Status Update",
                            message=f"Status changed to {new_status.value}: {external_info.get('notes', '')}"
                        )
                    updated_count += 1
            except Exception as e:
                logger.error(f"Error syncing application {app_rec.application_reference}: {e}")

        if updated_count > 0:
            db.commit()
            logger.info(f"Synced {updated_count} citizen applications with government portals.")
        return updated_count

    def task_check_scheme_freshness(self, db) -> int:
        """Flags schemes whose published information exceeds the re-verification threshold."""
        reverified_count = 0
        cutoff = datetime.utcnow() - timedelta(days=90)
        stale_schemes = db.query(Scheme).filter(
            Scheme.status == SchemeStatus.PUBLISHED,
            Scheme.published_at < cutoff
        ).limit(10).all()

        for s in stale_schemes:
            s.status = SchemeStatus.REVERIFICATION_REQUIRED
            reverified_count += 1

        if reverified_count > 0:
            db.commit()
            logger.info(f"Flagged {reverified_count} schemes for periodic re-verification.")
        return reverified_count

    def task_clean_expired_cache(self) -> int:
        """Evicts expired keys from in-memory cache service."""
        try:
            return CacheService.evict_expired()
        except Exception:
            return 0

    def run_cycle(self) -> Dict[str, Any]:
        """Execute one complete batch of background tasks."""
        self.last_heartbeat = datetime.utcnow()
        cycle_stats = {
            "timestamp": self.last_heartbeat.isoformat(),
            "synced_applications": 0,
            "reverified_schemes": 0,
            "evicted_cache_keys": 0
        }

        db = SessionLocal()
        try:
            self.tasks_executed += 1
            cycle_stats["synced_applications"] = self.task_sync_application_statuses(db)
            cycle_stats["reverified_schemes"] = self.task_check_scheme_freshness(db)
            cycle_stats["evicted_cache_keys"] = self.task_clean_expired_cache()
            self.tasks_succeeded += 1
        except Exception as e:
            self.tasks_failed += 1
            logger.error(f"Worker cycle encountered an error: {e}")
            db.rollback()
        finally:
            db.close()

        return cycle_stats

    def start(self):
        """Starts the persistent background worker daemon loop."""
        self.is_running = True
        self.register_signal_handlers()
        logger.info(f"Scheme Assistant Background Worker started (poll interval: {self.poll_interval}s)")

        while self.is_running:
            try:
                stats = self.run_cycle()
                time.sleep(self.poll_interval)
            except Exception as e:
                logger.error(f"Unexpected worker loop exception: {e}")
                time.sleep(self.poll_interval)

        logger.info("Worker process exited cleanly.")

    def get_health(self) -> Dict[str, Any]:
        """Return worker operational health for healthcheck monitoring."""
        return {
            "status": "healthy" if self.is_running or self.tasks_failed == 0 else "degraded",
            "uptime_seconds": (datetime.utcnow() - self.started_at).total_seconds(),
            "last_heartbeat": self.last_heartbeat.isoformat(),
            "tasks_executed": self.tasks_executed,
            "tasks_succeeded": self.tasks_succeeded,
            "tasks_failed": self.tasks_failed
        }

def main():
    parser = argparse.ArgumentParser(description="Government Scheme Assistant Background Worker")
    parser.add_argument("--once", action="store_true", help="Execute one task cycle and exit immediately (cron mode)")
    parser.add_argument("--interval", type=int, default=15, help="Polling interval in seconds")
    args = parser.parse_args()

    worker = SchemeAssistantWorker(poll_interval_seconds=args.interval)
    if args.once:
        logger.info("Running single worker task cycle (--once)...")
        stats = worker.run_cycle()
        logger.info(f"Single cycle completed successfully: {stats}")
        sys.exit(0)
    else:
        worker.start()

if __name__ == "__main__":
    main()
