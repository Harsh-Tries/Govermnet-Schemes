import sqlite3
import os
from app.core.config import settings

def run_migration():
    # Parse DB path from settings.DATABASE_URL
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
    else:
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "scheme_assistant.db")
    
    print(f"Connecting to database at {db_path}...")
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    # 1. citizen_applications columns
    app_cols = [c[1] for c in cur.execute("PRAGMA table_info(citizen_applications)").fetchall()]
    new_app_cols = [
        ("application_type", "VARCHAR(20)", "DEFAULT 'FRESH'"),
        ("tracking_method", "VARCHAR(50)", "DEFAULT 'MANUAL'"),
        ("last_synced_at", "DATETIME", "DEFAULT NULL"),
        ("rejection_reason", "TEXT", "DEFAULT NULL"),
        ("action_required_details", "TEXT", "DEFAULT NULL"),
        ("disbursement_details", "TEXT", "DEFAULT NULL")
    ]
    for col_name, col_type, col_def in new_app_cols:
        if col_name not in app_cols:
            print(f"Adding column '{col_name}' to citizen_applications...")
            cur.execute(f"ALTER TABLE citizen_applications ADD COLUMN {col_name} {col_type} {col_def}")

    # 2. application_status_history columns
    hist_cols = [c[1] for c in cur.execute("PRAGMA table_info(application_status_history)").fetchall()]
    new_hist_cols = [
        ("title", "VARCHAR(255)", "DEFAULT NULL"),
        ("remarks", "TEXT", "DEFAULT NULL"),
        ("created_by", "VARCHAR(100)", "DEFAULT NULL")
    ]
    for col_name, col_type, col_def in new_hist_cols:
        if col_name not in hist_cols:
            print(f"Adding column '{col_name}' to application_status_history...")
            cur.execute(f"ALTER TABLE application_status_history ADD COLUMN {col_name} {col_type} {col_def}")

    # 3. application_documents table
    print("Ensuring application_documents table exists...")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS application_documents (
        id VARCHAR(36) PRIMARY KEY,
        application_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36),
        document_name VARCHAR(255) NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100),
        file_size INTEGER,
        verification_status VARCHAR(50) DEFAULT 'PENDING',
        uploaded_at DATETIME NOT NULL,
        created_at DATETIME,
        updated_at DATETIME,
        FOREIGN KEY(application_id) REFERENCES citizen_applications(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # 4. Create index on application_documents
    cur.execute("CREATE INDEX IF NOT EXISTS ix_app_docs_app_id ON application_documents(application_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_app_docs_user_id ON application_documents(user_id)")

    con.commit()
    con.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    run_migration()
