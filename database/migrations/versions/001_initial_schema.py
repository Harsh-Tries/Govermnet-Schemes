"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-09-18 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Tables are auto-managed by SQLAlchemy metadata create_all for SQLite/Postgres dev
    pass

def downgrade() -> None:
    pass
