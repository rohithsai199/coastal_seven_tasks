"""add_sizes_and_reviews

Revision ID: cb291216c05c
Revises: 
Create Date: 2026-10-15 12:16:42.833407

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = 'cb291216c05c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    # 1. Add size column to order_items if not present
    order_items_cols = [c['name'] for c in insp.get_columns('order_items')]
    if 'size' not in order_items_cols:
        op.add_column('order_items', sa.Column('size', sa.String(), nullable=True, server_default='M'))

    # 2. Add sizes column to products if not present
    products_cols = [c['name'] for c in insp.get_columns('products')]
    if 'sizes' not in products_cols:
        op.add_column('products', sa.Column('sizes', sa.String(), nullable=True, server_default='S,M,L,XL'))

    # 3. Create reviews table if not present
    if 'reviews' not in insp.get_table_names():
        op.create_table(
            'reviews',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('product_id', sa.Integer(), sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
            sa.Column('rating', sa.Integer(), nullable=False),
            sa.Column('comment', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if 'reviews' in insp.get_table_names():
        op.drop_table('reviews')

    products_cols = [c['name'] for c in insp.get_columns('products')]
    if 'sizes' in products_cols:
        op.drop_column('products', 'sizes')

    order_items_cols = [c['name'] for c in insp.get_columns('order_items')]
    if 'size' in order_items_cols:
        op.drop_column('order_items', 'size')

