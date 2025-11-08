"""
Entry CRUD operations
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.entry import Entry
from app.schemas.entry import EntryCreate, EntryUpdate, EntryFilter, EntrySort


class CRUDEntry(CRUDBase[Entry, EntryCreate, EntryUpdate]):
    """CRUD operations for Entry"""

    async def get_by_calendar(
        self,
        db: AsyncSession,
        *,
        calendar_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[Entry]:
        """Get entries by calendar ID"""
        result = await db.execute(
            select(Entry)
            .where(Entry.calendar_id == calendar_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_task(
        self,
        db: AsyncSession,
        *,
        task_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[Entry]:
        """Get entries by task ID"""
        result = await db.execute(
            select(Entry)
            .where(Entry.task_id == task_id)
            .order_by(Entry.position_in_task)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_unscheduled(
        self,
        db: AsyncSession,
        *,
        calendar_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[Entry]:
        """Get entries without timestamp (unscheduled)"""
        result = await db.execute(
            select(Entry)
            .where(
                and_(
                    Entry.calendar_id == calendar_id,
                    Entry.timestamp.is_(None)
                )
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_filters(
        self,
        db: AsyncSession,
        *,
        filters: EntryFilter,
        sort: EntrySort,
        skip: int = 0,
        limit: int = 100
    ) -> List[Entry]:
        """Get entries with filters and sorting"""
        query = select(Entry).where(Entry.calendar_id == filters.calendar_id)

        # Apply filters
        if filters.task_id is not None:
            query = query.where(Entry.task_id == filters.task_id)

        if filters.entry_type is not None:
            query = query.where(Entry.entry_type == filters.entry_type)

        if filters.is_completed is not None:
            query = query.where(Entry.is_completed == filters.is_completed)

        if filters.has_timestamp is not None:
            if filters.has_timestamp:
                query = query.where(Entry.timestamp.isnot(None))
            else:
                query = query.where(Entry.timestamp.is_(None))

        if filters.tags is not None and len(filters.tags) > 0:
            # PostgreSQL ARRAY contains operator
            query = query.where(Entry.tags.contains(filters.tags))

        if filters.search is not None:
            search_term = f"%{filters.search}%"
            query = query.where(
                or_(
                    Entry.title.ilike(search_term),
                    Entry.content.ilike(search_term)
                )
            )

        # Apply sorting
        sort_column = getattr(Entry, sort.sort_by, Entry.created_at)
        if sort.order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Apply pagination
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        return result.scalars().all()

    async def get_stats(
        self,
        db: AsyncSession,
        *,
        calendar_id: UUID
    ) -> dict:
        """Get entry statistics for a calendar"""
        # Total entries
        total_result = await db.execute(
            select(func.count(Entry.id)).where(Entry.calendar_id == calendar_id)
        )
        total = total_result.scalar()

        # Completed entries
        completed_result = await db.execute(
            select(func.count(Entry.id)).where(
                and_(
                    Entry.calendar_id == calendar_id,
                    Entry.is_completed == True
                )
            )
        )
        completed = completed_result.scalar()

        # Scheduled entries (has timestamp)
        scheduled_result = await db.execute(
            select(func.count(Entry.id)).where(
                and_(
                    Entry.calendar_id == calendar_id,
                    Entry.timestamp.isnot(None)
                )
            )
        )
        scheduled = scheduled_result.scalar()

        # Unscheduled entries
        unscheduled = total - scheduled

        # TODO: Calculate overdue entries
        overdue = 0

        # Entries by type
        type_result = await db.execute(
            select(Entry.entry_type, func.count(Entry.id))
            .where(Entry.calendar_id == calendar_id)
            .group_by(Entry.entry_type)
        )
        entries_by_type = {row[0]: row[1] for row in type_result.all()}

        # Entries by priority
        priority_result = await db.execute(
            select(Entry.priority, func.count(Entry.id))
            .where(Entry.calendar_id == calendar_id)
            .group_by(Entry.priority)
        )
        entries_by_priority = {row[0]: row[1] for row in priority_result.all()}

        return {
            "total_entries": total,
            "completed_entries": completed,
            "scheduled_entries": scheduled,
            "unscheduled_entries": unscheduled,
            "overdue_entries": overdue,
            "entries_by_type": entries_by_type,
            "entries_by_priority": entries_by_priority,
        }


# Create a singleton instance
entry_crud = CRUDEntry(Entry)
