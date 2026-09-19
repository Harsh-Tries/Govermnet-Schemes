from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Scheme, SchemeVersion, SchemeUpdate, AuditLog
from app.enums import SchemeStatus, AuditAction

class SchemeChangeDetectorService:
    @staticmethod
    def create_version_snapshot(db: Session, scheme_id: str, change_summary: str, verified_by: str = "ADMIN") -> SchemeVersion:
        """Create a version snapshot of current scheme data before or after modifications."""
        scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
        if not scheme:
            raise ValueError("Scheme not found")

        # Get existing latest version number
        latest_ver = db.query(SchemeVersion).filter(SchemeVersion.scheme_id == scheme_id).order_by(SchemeVersion.version_number.desc()).first()
        new_ver_num = (latest_ver.version_number + 1) if latest_ver else 1

        # Snapshot current data
        version = SchemeVersion(
            scheme_id=scheme_id,
            version_number=new_ver_num,
            effective_from=datetime.utcnow(),
            eligibility_snapshot=[
                {
                    "rule_group_id": rg.id,
                    "logic_operator": rg.logic_operator,
                    "rules": [{"param": r.parameter.name if r.parameter else None, "op": r.operator, "value": r.value_value} for r in rg.rules]
                } for rg in scheme.rule_groups
            ],
            benefits_snapshot=[{"title": b.title, "amount": b.benefit_amount} for b in scheme.benefits],
            documents_snapshot=[{"name": d.document.name if d.document else None} for d in scheme.documents],
            source=scheme.application_process.official_application_url if scheme.application_process else None,
            verified_by=verified_by,
            verified_at=datetime.utcnow(),
            change_summary=change_summary
        )

        # Close out previous version effective_to date
        if latest_ver and not latest_ver.effective_to:
            latest_ver.effective_to = datetime.utcnow()

        db.add(version)
        db.commit()
        db.refresh(version)
        return version

    @staticmethod
    def detect_parameter_change(db: Session, scheme_id: str, parameter_name: str, old_val: str, new_val: str, detected_by: str = "SYSTEM") -> dict:
        """Detect a mismatch between published rules and incoming government source data."""
        scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
        if not scheme:
            raise ValueError("Scheme not found")

        # Mark scheme status as CHANGE_DETECTED
        scheme.status = SchemeStatus.CHANGE_DETECTED
        scheme.updated_at = datetime.utcnow()

        # Record update record
        update_rec = SchemeUpdate(
            scheme_id=scheme_id,
            changed_field=parameter_name,
            previous_value=str(old_val),
            new_value=str(new_val),
            reason=f"Automated change detected by {detected_by}."
        )
        db.add(update_rec)

        # Log audit entry
        audit = AuditLog(
            user_id=None,
            action=AuditAction.UPDATE_SCHEME,
            target_entity="SCHEME",
            target_id=scheme_id,
            payload={"detected_change": parameter_name, "old": old_val, "new": new_val}
        )
        db.add(audit)
        db.commit()

        return {
            "scheme_id": scheme_id,
            "scheme_name": scheme.name,
            "status": scheme.status.value,
            "changed_parameter": parameter_name,
            "old_value": old_val,
            "new_value": new_val,
            "requires_review": True
        }
