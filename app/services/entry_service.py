"""
Entry Service Layer - Business logic for entries
"""
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entry import Entry
from app.models.task import Task
from app.models.calendar import Calendar
from app.crud.entry import entry_crud
from app.schemas.entry import EntryUpdate, EntryFilter, EntrySort, EntryStats


class EntryService:
    """Entry business logic service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_calendar_access(
        self,
        calendar_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Check if user has access to calendar

        Returns:
            bool: True if user has access, False otherwise
        """
        result = await self.db.execute(
            select(Calendar).where(
                Calendar.id == calendar_id,
                Calendar.owner_id == user_id
            )
        )
        calendar = result.scalar_one_or_none()
        return calendar is not None

    async def get_entry_with_details(
        self,
        entry_id: UUID
    ) -> Optional[Entry]:
        """
        Get entry with all details (attachments, comments)

        TODO: Load relationships when Attachment and Comment models are created
        """
        result = await self.db.execute(
            select(Entry).where(Entry.id == entry_id)
        )
        return result.scalar_one_or_none()

    async def list_entries(
        self,
        filters: EntryFilter,
        sort: EntrySort,
        skip: int = 0,
        limit: int = 100
    ) -> List[Entry]:
        """List entries with filters and sorting"""
        return await entry_crud.get_by_filters(
            self.db,
            filters=filters,
            sort=sort,
            skip=skip,
            limit=limit
        )

    async def toggle_complete(
        self,
        entry_id: UUID,
        is_completed: bool,
        user_id: UUID
    ) -> Entry:
        """Toggle entry completion status"""
        entry = await entry_crud.get(self.db, id=entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entry not found"
            )

        # Check access
        has_access = await self.check_calendar_access(entry.calendar_id, user_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this calendar"
            )

        # Update completion status
        update_data = {
            "is_completed": is_completed,
            "completed_at": datetime.now(timezone.utc) if is_completed else None,
            "completed_by": user_id if is_completed else None,
            "last_modified_by": user_id
        }

        updated_entry = await entry_crud.update(
            self.db,
            db_obj=entry,
            obj_in=update_data
        )

        return updated_entry

    async def add_to_task(
        self,
        entry_id: UUID,
        task_id: UUID,
        position: Optional[int],
        user_id: UUID
    ) -> Entry:
        """Add entry to a task"""
        # Get entry
        entry = await entry_crud.get(self.db, id=entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entry not found"
            )

        # Get task
        task_result = await self.db.execute(
            select(Task).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        # Verify both belong to same calendar
        if entry.calendar_id != task.calendar_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entry and task must belong to the same calendar"
            )

        # Check access
        has_access = await self.check_calendar_access(entry.calendar_id, user_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this calendar"
            )

        # Update entry
        update_data = {
            "task_id": task_id,
            "position_in_task": position,
            "last_modified_by": user_id
        }

        updated_entry = await entry_crud.update(
            self.db,
            db_obj=entry,
            obj_in=update_data
        )

        return updated_entry

    async def remove_from_task(
        self,
        entry_id: UUID,
        user_id: UUID
    ) -> Entry:
        """
        Remove entry from task

        Note: Entry is not deleted, just detached from task
        """
        entry = await entry_crud.get(self.db, id=entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entry not found"
            )

        # Check access
        has_access = await self.check_calendar_access(entry.calendar_id, user_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this calendar"
            )

        # Remove from task
        update_data = {
            "task_id": None,
            "position_in_task": None,
            "last_modified_by": user_id
        }

        updated_entry = await entry_crud.update(
            self.db,
            db_obj=entry,
            obj_in=update_data
        )

        return updated_entry

    async def batch_update(
        self,
        entry_ids: List[UUID],
        updates: EntryUpdate,
        user_id: UUID
    ) -> List[Entry]:
        """Batch update entries"""
        updated_entries = []

        for entry_id in entry_ids:
            entry = await entry_crud.get(self.db, id=entry_id)
            if not entry:
                continue

            # Check access
            has_access = await self.check_calendar_access(entry.calendar_id, user_id)
            if not has_access:
                continue

            updated_entry = await entry_crud.update(
                self.db,
                db_obj=entry,
                obj_in=updates,
                last_modified_by=user_id
            )
            updated_entries.append(updated_entry)

        return updated_entries

    async def batch_add_to_task(
        self,
        entry_ids: List[UUID],
        task_id: UUID,
        user_id: UUID
    ) -> List[Entry]:
        """Batch add entries to task"""
        # Verify task exists
        task_result = await self.db.execute(
            select(Task).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )

        updated_entries = []

        for entry_id in entry_ids:
            entry = await entry_crud.get(self.db, id=entry_id)
            if not entry:
                continue

            # Verify same calendar
            if entry.calendar_id != task.calendar_id:
                continue

            # Check access
            has_access = await self.check_calendar_access(entry.calendar_id, user_id)
            if not has_access:
                continue

            updated_entry = await entry_crud.update(
                self.db,
                db_obj=entry,
                obj_in={"task_id": task_id},
                last_modified_by=user_id
            )
            updated_entries.append(updated_entry)

        return updated_entries

    async def batch_delete(
        self,
        entry_ids: List[UUID],
        user_id: UUID
    ) -> None:
        """Batch delete entries"""
        for entry_id in entry_ids:
            entry = await entry_crud.get(self.db, id=entry_id)
            if not entry:
                continue

            # Check access
            has_access = await self.check_calendar_access(entry.calendar_id, user_id)
            if not has_access:
                continue

            await entry_crud.remove(self.db, id=entry_id)

    async def get_stats(
        self,
        calendar_id: UUID
    ) -> EntryStats:
        """Get entry statistics"""
        stats_data = await entry_crud.get_stats(
            self.db,
            calendar_id=calendar_id
        )
        return EntryStats(**stats_data)
