"""
任務 (Task) CRUD 操作
"""
from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.task import Task
from app.models.entry import Entry
from app.schemas.task import TaskCreate, TaskUpdate


class CRUDTask(CRUDBase[Task, TaskCreate, TaskUpdate]):
    """Task CRUD 操作"""

    async def get_by_calendar(
        self,
        db: AsyncSession,
        *,
        calendar_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> list[Task]:
        """取得日曆中的所有任務"""
        result = await db.execute(
            select(Task)
            .where(Task.calendar_id == calendar_id)
            .order_by(Task.position, Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_with_entries(
        self,
        db: AsyncSession,
        *,
        task_id: UUID
    ) -> Optional[Task]:
        """取得任務及其所有記事"""
        result = await db.execute(
            select(Task)
            .options(selectinload(Task.entries))
            .where(Task.id == task_id)
        )
        return result.scalar_one_or_none()

    async def get_by_filters(
        self,
        db: AsyncSession,
        *,
        calendar_id: UUID,
        status: Optional[str] = None,
        is_overdue: Optional[bool] = None,
        has_due_date: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> list[Task]:
        """根據篩選條件取得任務"""
        query = select(Task).where(Task.calendar_id == calendar_id)

        if status:
            query = query.where(Task.status == status)

        if has_due_date is not None:
            if has_due_date:
                query = query.where(Task.due_date.isnot(None))
            else:
                query = query.where(Task.due_date.is_(None))

        if is_overdue:
            # 只返回未完成且截止日期已過的任務
            today = date.today()
            query = query.where(
                and_(
                    Task.status != "completed",
                    Task.due_date.isnot(None),
                    Task.due_date < today
                )
            )

        query = query.order_by(Task.position, Task.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create_with_calendar(
        self,
        db: AsyncSession,
        *,
        obj_in: TaskCreate,
        user_id: UUID
    ) -> Task:
        """創建任務並設定創建者"""
        task_data = obj_in.model_dump()
        db_obj = Task(**task_data, created_by=user_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def complete_task(
        self,
        db: AsyncSession,
        *,
        task_id: UUID,
        mark_all_entries_complete: bool = False
    ) -> Task:
        """完成任務（可選：同時完成所有記事）"""
        task = await self.get(db, id=task_id)
        if not task:
            return None

        # 更新任務狀態
        task.status = "completed"
        task.completed_at = func.now()

        # 如果需要，標記所有記事為完成
        if mark_all_entries_complete:
            await db.execute(
                select(Entry)
                .where(Entry.task_id == task_id)
            )
            entries = (await db.execute(
                select(Entry).where(Entry.task_id == task_id)
            )).scalars().all()

            for entry in entries:
                if not entry.is_completed:
                    entry.is_completed = True
                    entry.completed_at = func.now()

        await db.commit()
        await db.refresh(task)
        return task

    async def reopen_task(
        self,
        db: AsyncSession,
        *,
        task_id: UUID
    ) -> Task:
        """重新開啟已完成的任務"""
        task = await self.get(db, id=task_id)
        if not task:
            return None

        task.status = "active"
        task.completed_at = None

        await db.commit()
        await db.refresh(task)
        return task

    async def archive_task(
        self,
        db: AsyncSession,
        *,
        task_id: UUID
    ) -> Task:
        """封存任務"""
        task = await self.get(db, id=task_id)
        if not task:
            return None

        task.status = "archived"

        await db.commit()
        await db.refresh(task)
        return task

    async def get_stats(
        self,
        db: AsyncSession,
        *,
        task_id: UUID
    ) -> Optional[dict]:
        """取得任務統計資料"""
        task = await self.get(db, id=task_id)
        if not task:
            return None

        return {
            "total_entries": task.total_entries,
            "completed_entries": task.completed_entries,
            "pending_entries": task.total_entries - task.completed_entries,
            "completion_percentage": task.completion_percentage,
            "is_completed": task.is_completed,
            "is_overdue": task.is_overdue
        }

    async def reorder_tasks(
        self,
        db: AsyncSession,
        *,
        task_orders: list[dict]
    ) -> list[Task]:
        """重新排序任務"""
        updated_tasks = []

        for order in task_orders:
            task_id = order.get("task_id")
            position = order.get("position")

            task = await self.get(db, id=UUID(task_id))
            if task:
                task.position = position
                updated_tasks.append(task)

        await db.commit()

        # 刷新所有任務
        for task in updated_tasks:
            await db.refresh(task)

        return updated_tasks

    async def check_access(
        self,
        db: AsyncSession,
        *,
        task_id: UUID,
        user_id: UUID
    ) -> bool:
        """檢查使用者是否有權限訪問任務"""
        result = await db.execute(
            select(Task)
            .join(Task.calendar)
            .where(
                and_(
                    Task.id == task_id,
                    Task.calendar.has(owner_id=user_id)
                )
            )
        )
        return result.scalar_one_or_none() is not None


# 建立單例實例
task_crud = CRUDTask(Task)
