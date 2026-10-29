"""add onboarding profile fields

Revision ID: 002
Revises: 001
Create Date: 2026-10-29 23:38:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade() -> None:
    with op.batch_alter_table('user_profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('full_name', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('taluka', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('village_city', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('is_maharashtra_resident', sa.Boolean(), server_default='1', nullable=False))
        batch_op.add_column(sa.Column('beneficiary_categories', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('student_details', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('farmer_details', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('entrepreneur_details', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('vulnerable_details', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('onboarding_step', sa.Integer(), server_default='1', nullable=False))
        batch_op.add_column(sa.Column('is_onboarding_completed', sa.Boolean(), server_default='0', nullable=False))

def downgrade() -> None:
    with op.batch_alter_table('user_profiles', schema=None) as batch_op:
        batch_op.drop_column('is_onboarding_completed')
        batch_op.drop_column('onboarding_step')
        batch_op.drop_column('vulnerable_details')
        batch_op.drop_column('entrepreneur_details')
        batch_op.drop_column('farmer_details')
        batch_op.drop_column('student_details')
        batch_op.drop_column('beneficiary_categories')
        batch_op.drop_column('is_maharashtra_resident')
        batch_op.drop_column('village_city')
        batch_op.drop_column('taluka')
        batch_op.drop_column('full_name')
