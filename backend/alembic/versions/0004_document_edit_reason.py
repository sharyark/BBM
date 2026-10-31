"""edit reason on financial documents (shown as an "Edited" tag)

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-31
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLES = ("deliveries", "purchases", "rentals", "payments", "expenses", "invoices", "wage_settlements")


def upgrade() -> None:
    for table in TABLES:
        op.add_column(table, sa.Column("edit_count", sa.Integer(), server_default="0", nullable=False))
        op.add_column(table, sa.Column("edit_reason", sa.Text(), nullable=True))
        op.add_column(table, sa.Column("edited_at", sa.DateTime(timezone=True), nullable=True))
        op.add_column(
            table, sa.Column("edited_by", sa.BigInteger().with_variant(sa.Integer(), "sqlite"), nullable=True)
        )
        op.create_foreign_key(f"fk_{table}_edited_by_users", table, "users", ["edited_by"], ["id"])


def downgrade() -> None:
    for table in TABLES:
        op.drop_constraint(f"fk_{table}_edited_by_users", table, type_="foreignkey")
        for column in ("edited_by", "edited_at", "edit_reason", "edit_count"):
            op.drop_column(table, column)
