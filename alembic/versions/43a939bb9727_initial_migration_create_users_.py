"""Initial migration: create users, calendars, entries, and tasks tables

Revision ID: 43a939bb9727
Revises:
Create Date: 2025-11-09 04:35:08.335167

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '43a939bb9727'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('username', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('is_superuser', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create calendars table
    op.create_table(
        'calendars',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('timezone', sa.String(50), nullable=False, server_default='UTC'),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('is_default', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create tasks table (container without timestamp)
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('calendar_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calendars.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('due_date', sa.Date, nullable=True, index=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('total_entries', sa.Integer, nullable=False, server_default='0'),
        sa.Column('completed_entries', sa.Integer, nullable=False, server_default='0'),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('position', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_check_constraint('check_task_status', 'tasks', "status IN ('active', 'completed', 'archived', 'cancelled')")
    op.create_index('idx_tasks_position', 'tasks', ['calendar_id', 'position'])

    # Create entries table (first-class citizen with timestamp)
    op.create_table(
        'entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('calendar_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('calendars.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('content', sa.Text, nullable=True),
        sa.Column('timestamp', sa.TIMESTAMP(timezone=True), nullable=True, index=True),
        sa.Column('entry_type', sa.String(20), nullable=False, server_default='task'),
        sa.Column('is_completed', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('priority', sa.Integer, nullable=False, server_default='0'),
        sa.Column('tags', postgresql.ARRAY(sa.String), nullable=True),
        sa.Column('metadata', postgresql.JSONB, nullable=True),
        sa.Column('position_in_task', sa.Integer, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_check_constraint('check_entry_type', 'entries', "entry_type IN ('task', 'event', 'note', 'reminder')")
    op.create_index('idx_entries_priority', 'entries', ['priority'])
    op.create_index('idx_entries_completed', 'entries', ['is_completed'])
    op.create_index('idx_entries_task_position', 'entries', ['task_id', 'position_in_task'], postgresql_where=sa.text('task_id IS NOT NULL'))

    # Create function to update task completion statistics
    op.execute("""
        CREATE OR REPLACE FUNCTION update_task_completion()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Update total_entries and completed_entries for the task
            IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                UPDATE tasks
                SET
                    total_entries = (
                        SELECT COUNT(*) FROM entries WHERE task_id = NEW.task_id
                    ),
                    completed_entries = (
                        SELECT COUNT(*) FROM entries WHERE task_id = NEW.task_id AND is_completed = true
                    ),
                    updated_at = NOW()
                WHERE id = NEW.task_id;
            END IF;

            -- Also update old task if entry was moved
            IF TG_OP = 'UPDATE' AND OLD.task_id IS DISTINCT FROM NEW.task_id AND OLD.task_id IS NOT NULL THEN
                UPDATE tasks
                SET
                    total_entries = (
                        SELECT COUNT(*) FROM entries WHERE task_id = OLD.task_id
                    ),
                    completed_entries = (
                        SELECT COUNT(*) FROM entries WHERE task_id = OLD.task_id AND is_completed = true
                    ),
                    updated_at = NOW()
                WHERE id = OLD.task_id;
            END IF;

            -- Handle deletion
            IF TG_OP = 'DELETE' AND OLD.task_id IS NOT NULL THEN
                UPDATE tasks
                SET
                    total_entries = (
                        SELECT COUNT(*) FROM entries WHERE task_id = OLD.task_id
                    ),
                    completed_entries = (
                        SELECT COUNT(*) FROM entries WHERE task_id = OLD.task_id AND is_completed = true
                    ),
                    updated_at = NOW()
                WHERE id = OLD.task_id;
            END IF;

            RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create trigger to auto-update task completion
    op.execute("""
        CREATE TRIGGER trigger_update_task_completion
        AFTER INSERT OR UPDATE OF is_completed, task_id OR DELETE ON entries
        FOR EACH ROW
        EXECUTE FUNCTION update_task_completion();
    """)


def downgrade() -> None:
    # Drop trigger and function
    op.execute('DROP TRIGGER IF EXISTS trigger_update_task_completion ON entries')
    op.execute('DROP FUNCTION IF EXISTS update_task_completion()')

    # Drop tables in reverse order (to respect foreign keys)
    op.drop_table('entries')
    op.drop_table('tasks')
    op.drop_table('calendars')
    op.drop_table('users')

    # Drop UUID extension
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
