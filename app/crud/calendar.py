"""
日曆 (Calendar) CRUD 操作
"""
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.calendar import Calendar
from app.models.entry import Entry
from app.models.task import Task
from app.schemas.calendar import CalendarCreate, CalendarUpdate


class CRUDCalendar(CRUDBase[Calendar, CalendarCreate, CalendarUpdate]):
    """Calendar CRUD 操作"""

    async def get_by_owner(
        self,
        db: AsyncSession,
        *,
        owner_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> list[Calendar]:
        """取得使用者的所有日曆"""
        result = await db.execute(
            select(Calendar)
            .where(Calendar.owner_id == owner_id)
            .order_by(Calendar.is_default.desc(), Calendar.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_default_calendar(
        self,
        db: AsyncSession,
        *,
        owner_id: UUID
    ) -> Optional[Calendar]:
        """取得使用者的預設日曆"""
        result = await db.execute(
            select(Calendar).where(
                and_(
                    Calendar.owner_id == owner_id,
                    Calendar.is_default == True
                )
            )
        )
        return result.scalar_one_or_none()

    async def set_default_calendar(
        self,
        db: AsyncSession,
        *,
        calendar_id: UUID,
        owner_id: UUID
    ) -> Calendar:
        """設定預設日曆（同時取消其他日曆的預設狀態）"""
        # 取消所有該使用者日曆的預設狀態
        await db.execute(
            select(Calendar)
            .where(Calendar.owner_id == owner_id)
        )
        calendars = (await db.execute(
            select(Calendar).where(Calendar.owner_id == owner_id)
        )).scalars().all()

        for cal in calendars:
            cal.is_default = (cal.id == calendar_id)

        await db.commit()

        # 返回新的預設日曆
        result = await db.execute(
            select(Calendar).where(Calendar.id == calendar_id)
        )
        calendar = result.scalar_one()
        await db.refresh(calendar)
        return calendar

    async def get_with_stats(
        self,
        db: AsyncSession,
        *,
        calendar_id: UUID
    ) -> Optional[dict]:
        """取得日曆及其統計資料"""
        # 取得日曆
        calendar = await self.get(db, id=calendar_id)
        if not calendar:
            return None

        # 計算統計資料
        # 總記事數
        total_entries_result = await db.execute(
            select(func.count(Entry.id)).where(Entry.calendar_id == calendar_id)
        )
        total_entries = total_entries_result.scalar() or 0

        # 已完成記事數
        completed_entries_result = await db.execute(
            select(func.count(Entry.id)).where(
                and_(
                    Entry.calendar_id == calendar_id,
                    Entry.is_completed == True
                )
            )
        )
        completed_entries = completed_entries_result.scalar() or 0

        # 總任務數
        total_tasks_result = await db.execute(
            select(func.count(Task.id)).where(Task.calendar_id == calendar_id)
        )
        total_tasks = total_tasks_result.scalar() or 0

        return {
            **calendar.__dict__,
            "total_entries": total_entries,
            "completed_entries": completed_entries,
            "total_tasks": total_tasks
        }

    async def create_with_owner(
        self,
        db: AsyncSession,
        *,
        obj_in: CalendarCreate,
        owner_id: UUID
    ) -> Calendar:
        """創建日曆並設定擁有者"""
        # 如果這是使用者的第一個日曆，自動設為預設
        existing_count = await db.execute(
            select(func.count(Calendar.id)).where(Calendar.owner_id == owner_id)
        )
        is_first = existing_count.scalar() == 0

        calendar_data = obj_in.model_dump()
        if is_first:
            calendar_data["is_default"] = True

        db_obj = Calendar(
            **calendar_data,
            owner_id=owner_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def check_access(
        self,
        db: AsyncSession,
        *,
        calendar_id: UUID,
        user_id: UUID
    ) -> bool:
        """檢查使用者是否有權限訪問日曆"""
        result = await db.execute(
            select(Calendar).where(
                and_(
                    Calendar.id == calendar_id,
                    Calendar.owner_id == user_id
                )
            )
        )
        return result.scalar_one_or_none() is not None


# 建立單例實例
calendar_crud = CRUDCalendar(Calendar)
