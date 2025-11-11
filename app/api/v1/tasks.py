"""
任務 (Task) API 路由
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.crud.task import task_crud
from app.crud.calendar import calendar_crud
from app.models.user import User
from app.core.websocket_manager import manager
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskWithEntries,
    TaskStats,
    TaskFilter,
    TaskSort,
    TaskList,
    TaskCompleteRequest,
    TaskBatchUpdate,
    TaskBatchDelete,
    TaskReorderRequest
)

router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """創建新任務"""
    # 檢查日曆存在且屬於當前使用者
    has_access = await calendar_crud.check_access(
        db,
        calendar_id=task_in.calendar_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found"
        )

    task = await task_crud.create_with_calendar(
        db,
        obj_in=task_in,
        user_id=current_user.id
    )
    return task


@router.get("/", response_model=TaskList)
async def list_tasks(
    calendar_id: UUID = Query(..., description="日曆 ID"),
    status: str = Query(None, pattern=r'^(active|completed|archived|cancelled)$'),
    is_overdue: bool = Query(None),
    has_due_date: bool = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """取得任務列表（支持篩選）"""
    # 檢查日曆權限
    has_access = await calendar_crud.check_access(
        db,
        calendar_id=calendar_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found"
        )

    tasks = await task_crud.get_by_filters(
        db,
        calendar_id=calendar_id,
        status=status,
        is_overdue=is_overdue,
        has_due_date=has_due_date,
        skip=skip,
        limit=limit
    )

    return {
        "tasks": tasks,
        "total": len(tasks)
    }


@router.get("/{task_id}", response_model=TaskWithEntries)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """取得單一任務（包含記事列表）"""
    # 檢查權限
    has_access = await task_crud.check_access(
        db,
        task_id=task_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task = await task_crud.get_with_entries(db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新任務"""
    # 檢查權限
    has_access = await task_crud.check_access(
        db,
        task_id=task_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task = await task_crud.get(db, id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    updated_task = await task_crud.update(
        db,
        db_obj=task,
        obj_in=task_in
    )

    return updated_task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """刪除任務"""
    # 檢查權限
    has_access = await task_crud.check_access(
        db,
        task_id=task_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task = await task_crud.get(db, id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # 刪除任務
    await task_crud.remove(db, id=task_id)

    # WebSocket 廣播
    await manager.broadcast_to_calendar(
        calendar_id=task.calendar_id,
        message={
            "type": "task:deleted",
            "data": {"id": str(task_id), "calendar_id": str(task.calendar_id)}
        }
    )


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: UUID,
    request: TaskCompleteRequest = TaskCompleteRequest(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """完成任務（可選：同時完成所有記事）"""
    # 檢查權限
    has_access = await task_crud.check_access(
        db,
        task_id=task_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task = await task_crud.complete_task(
        db,
        task_id=task_id,
        mark_all_entries_complete=request.mark_all_entries_complete
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@router.post("/{task_id}/reopen", response_model=TaskResponse)
async def reopen_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """重新開啟已完成的任務"""
    # 檢查權限
    has_access = await task_crud.check_access(
        db,
        task_id=task_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task = await task_crud.reopen_task(db, task_id=task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@router.post("/{task_id}/archive", response_model=TaskResponse)
async def archive_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """封存任務"""
    # 檢查權限
    has_access = await task_crud.check_access(
        db,
        task_id=task_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task = await task_crud.archive_task(db, task_id=task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@router.get("/{task_id}/stats", response_model=TaskStats)
async def get_task_stats(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """取得任務統計資料"""
    # 檢查權限
    has_access = await task_crud.check_access(
        db,
        task_id=task_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    stats = await task_crud.get_stats(db, task_id=task_id)

    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return stats


@router.post("/reorder", response_model=list[TaskResponse])
async def reorder_tasks(
    request: TaskReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """重新排序任務"""
    # 驗證所有任務的權限
    for order in request.task_orders:
        task_id = UUID(order["task_id"])
        has_access = await task_crud.check_access(
            db,
            task_id=task_id,
            user_id=current_user.id
        )

        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )

    updated_tasks = await task_crud.reorder_tasks(
        db,
        task_orders=request.task_orders
    )

    return updated_tasks


@router.patch("/batch", response_model=list[TaskResponse])
async def batch_update_tasks(
    request: TaskBatchUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量更新任務"""
    updated_tasks = []

    for task_id in request.task_ids:
        # 檢查權限
        has_access = await task_crud.check_access(
            db,
            task_id=task_id,
            user_id=current_user.id
        )

        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )

        task = await task_crud.get(db, id=task_id)
        if task:
            updated_task = await task_crud.update(
                db,
                db_obj=task,
                obj_in=request.update_data
            )
            updated_tasks.append(updated_task)

    return updated_tasks


@router.delete("/batch", status_code=status.HTTP_204_NO_CONTENT)
async def batch_delete_tasks(
    request: TaskBatchDelete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量刪除任務"""
    for task_id in request.task_ids:
        # 檢查權限
        has_access = await task_crud.check_access(
            db,
            task_id=task_id,
            user_id=current_user.id
        )

        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )

        await task_crud.remove(db, id=task_id)
