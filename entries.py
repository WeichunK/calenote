"""
記事 (Entry) API 路由
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.entry import (
    EntryCreate,
    EntryUpdate,
    EntryInDB,
    EntryWithStats,
    EntryDetail,
    EntryComplete,
    EntryAddToTask,
    EntryFilter,
    EntrySort,
    EntryStats,
    EntryBatchUpdate,
    EntryBatchAddToTask,
    EntryBatchDelete,
)
from app.crud.entry import entry_crud
from app.services.entry_service import EntryService
from app.core.websocket_manager import manager


router = APIRouter(prefix="/entries", tags=["entries"])


# ============================================
# CRUD 端點
# ============================================

@router.post("/", response_model=EntryInDB, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry_in: EntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    建立新記事
    
    記事是系統的第一公民，可以：
    - 獨立存在（task_id = null）
    - 屬於某個任務（task_id 有值）
    - 有時間戳（顯示在日曆）或無時間戳（放在未排程區）
    """
    service = EntryService(db)
    
    # 驗證日曆存取權限
    has_access = await service.check_calendar_access(
        calendar_id=entry_in.calendar_id,
        user_id=current_user.id
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="沒有存取此日曆的權限"
        )
    
    # 建立記事
    entry = await entry_crud.create(
        db,
        obj_in=entry_in,
        created_by=current_user.id
    )
    
    # WebSocket 廣播（即時同步）
    await manager.broadcast_to_calendar(
        calendar_id=entry.calendar_id,
        message={
            "type": "entry:created",
            "data": EntryInDB.model_validate(entry).model_dump(mode="json")
        }
    )
    
    return entry


@router.get("/{entry_id}", response_model=EntryDetail)
async def get_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """取得單筆記事詳情（包含附件、留言）"""
    service = EntryService(db)
    
    entry = await service.get_entry_with_details(entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到此記事"
        )
    
    # 驗證存取權限
    has_access = await service.check_calendar_access(
        calendar_id=entry.calendar_id,
        user_id=current_user.id
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="沒有存取權限"
        )
    
    return entry


@router.get("/", response_model=List[EntryWithStats])
async def list_entries(
    calendar_id: UUID,
    task_id: Optional[UUID] = None,
    entry_type: Optional[str] = Query(None, regex="^(note|task|event)$"),
    is_completed: Optional[bool] = None,
    has_timestamp: Optional[bool] = None,
    tags: Optional[List[str]] = Query(None),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|timestamp|title|priority)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    列出記事（支援篩選、排序、分頁）
    
    範例：
    - 取得未排程的記事：has_timestamp=false
    - 取得某任務的所有記事：task_id=xxx
    - 搜尋：search=關鍵字
    """
    service = EntryService(db)
    
    # 驗證權限
    has_access = await service.check_calendar_access(
        calendar_id=calendar_id,
        user_id=current_user.id
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="沒有存取權限"
        )
    
    # 建立篩選條件
    filters = EntryFilter(
        calendar_id=calendar_id,
        task_id=task_id,
        entry_type=entry_type,
        is_completed=is_completed,
        has_timestamp=has_timestamp,
        tags=tags,
        search=search,
    )
    
    # 排序
    sort = EntrySort(sort_by=sort_by, order=order)
    
    # 查詢
    entries = await service.list_entries(
        filters=filters,
        sort=sort,
        skip=skip,
        limit=limit
    )
    
    return entries


@router.patch("/{entry_id}", response_model=EntryInDB)
async def update_entry(
    entry_id: UUID,
    entry_update: EntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新記事"""
    service = EntryService(db)
    
    # 取得原記事
    entry = await entry_crud.get(db, id=entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到此記事"
        )
    
    # 驗證權限
    has_access = await service.check_calendar_access(
        calendar_id=entry.calendar_id,
        user_id=current_user.id
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="沒有存取權限"
        )
    
    # 更新
    updated_entry = await entry_crud.update(
        db,
        db_obj=entry,
        obj_in=entry_update,
        last_modified_by=current_user.id
    )
    
    # WebSocket 廣播
    await manager.broadcast_to_calendar(
        calendar_id=entry.calendar_id,
        message={
            "type": "entry:updated",
            "data": {
                "id": str(entry_id),
                "changes": entry_update.model_dump(exclude_unset=True)
            }
        }
    )
    
    return updated_entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """刪除記事"""
    service = EntryService(db)
    
    entry = await entry_crud.get(db, id=entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到此記事"
        )
    
    has_access = await service.check_calendar_access(
        calendar_id=entry.calendar_id,
        user_id=current_user.id
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="沒有存取權限"
        )
    
    await entry_crud.remove(db, id=entry_id)
    
    # WebSocket 廣播
    await manager.broadcast_to_calendar(
        calendar_id=entry.calendar_id,
        message={
            "type": "entry:deleted",
            "data": {"id": str(entry_id)}
        }
    )


# ============================================
# 特殊操作端點
# ============================================

@router.post("/{entry_id}/complete", response_model=EntryInDB)
async def toggle_complete(
    entry_id: UUID,
    complete_data: EntryComplete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """標記完成/未完成"""
    service = EntryService(db)
    
    entry = await service.toggle_complete(
        entry_id=entry_id,
        is_completed=complete_data.is_completed,
        user_id=current_user.id
    )
    
    # WebSocket 廣播
    await manager.broadcast_to_calendar(
        calendar_id=entry.calendar_id,
        message={
            "type": "entry:completed",
            "data": {
                "id": str(entry_id),
                "is_completed": complete_data.is_completed
            }
        }
    )
    
    return entry


@router.post("/{entry_id}/add-to-task", response_model=EntryInDB)
async def add_to_task(
    entry_id: UUID,
    task_data: EntryAddToTask,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """將記事加入任務"""
    service = EntryService(db)
    
    entry = await service.add_to_task(
        entry_id=entry_id,
        task_id=task_data.task_id,
        position=task_data.position,
        user_id=current_user.id
    )
    
    return entry


@router.post("/{entry_id}/remove-from-task", response_model=EntryInDB)
async def remove_from_task(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    從任務中移除記事
    注意：記事本身不會被刪除，只是脫離任務變成獨立記事
    """
    service = EntryService(db)
    
    entry = await service.remove_from_task(
        entry_id=entry_id,
        user_id=current_user.id
    )
    
    return entry


# ============================================
# 批次操作端點
# ============================================

@router.post("/batch/update")
async def batch_update(
    batch_data: EntryBatchUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """批次更新記事"""
    service = EntryService(db)
    
    results = await service.batch_update(
        entry_ids=batch_data.entry_ids,
        updates=batch_data.updates,
        user_id=current_user.id
    )
    
    return {"updated": len(results), "entries": results}


@router.post("/batch/add-to-task")
async def batch_add_to_task(
    batch_data: EntryBatchAddToTask,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """批次加入任務"""
    service = EntryService(db)
    
    results = await service.batch_add_to_task(
        entry_ids=batch_data.entry_ids,
        task_id=batch_data.task_id,
        user_id=current_user.id
    )
    
    return {"updated": len(results)}


@router.post("/batch/delete", status_code=status.HTTP_204_NO_CONTENT)
async def batch_delete(
    batch_data: EntryBatchDelete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """批次刪除"""
    service = EntryService(db)
    
    await service.batch_delete(
        entry_ids=batch_data.entry_ids,
        user_id=current_user.id
    )


# ============================================
# 統計端點
# ============================================

@router.get("/stats/{calendar_id}", response_model=EntryStats)
async def get_stats(
    calendar_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """取得記事統計資訊"""
    service = EntryService(db)
    
    has_access = await service.check_calendar_access(
        calendar_id=calendar_id,
        user_id=current_user.id
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="沒有存取權限"
        )
    
    stats = await service.get_stats(calendar_id)
    return stats
