"""
日曆 (Calendar) API 路由
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.crud.calendar import calendar_crud
from app.models.user import User
from app.schemas.calendar import (
    CalendarCreate,
    CalendarUpdate,
    CalendarResponse,
    CalendarWithStats,
    CalendarList,
    SetDefaultCalendarRequest
)

router = APIRouter()


@router.post("/", response_model=CalendarResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar(
    calendar_in: CalendarCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """創建新日曆"""
    calendar = await calendar_crud.create_with_owner(
        db,
        obj_in=calendar_in,
        owner_id=current_user.id
    )
    return calendar


@router.get("/", response_model=CalendarList)
async def list_calendars(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """取得當前使用者的所有日曆"""
    calendars = await calendar_crud.get_by_owner(
        db,
        owner_id=current_user.id,
        skip=skip,
        limit=limit
    )

    # 為每個日曆獲取統計資料
    calendars_with_stats = []
    for calendar in calendars:
        stats = await calendar_crud.get_with_stats(db, calendar_id=calendar.id)
        calendars_with_stats.append(stats)

    return {
        "calendars": calendars_with_stats,
        "total": len(calendars_with_stats)
    }


@router.get("/default", response_model=CalendarResponse)
async def get_default_calendar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """取得當前使用者的預設日曆"""
    calendar = await calendar_crud.get_default_calendar(
        db,
        owner_id=current_user.id
    )

    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default calendar found"
        )

    return calendar


@router.post("/default", response_model=CalendarResponse)
async def set_default_calendar(
    request: SetDefaultCalendarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """設定預設日曆"""
    # 檢查日曆是否存在且屬於當前使用者
    has_access = await calendar_crud.check_access(
        db,
        calendar_id=request.calendar_id,
        user_id=current_user.id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found"
        )

    calendar = await calendar_crud.set_default_calendar(
        db,
        calendar_id=request.calendar_id,
        owner_id=current_user.id
    )

    return calendar


@router.get("/{calendar_id}", response_model=CalendarWithStats)
async def get_calendar(
    calendar_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """取得單一日曆（包含統計資料）"""
    # 檢查權限
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

    stats = await calendar_crud.get_with_stats(db, calendar_id=calendar_id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found"
        )

    return stats


@router.patch("/{calendar_id}", response_model=CalendarResponse)
async def update_calendar(
    calendar_id: UUID,
    calendar_in: CalendarUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新日曆"""
    # 檢查權限
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

    calendar = await calendar_crud.get(db, id=calendar_id)
    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found"
        )

    updated_calendar = await calendar_crud.update(
        db,
        db_obj=calendar,
        obj_in=calendar_in
    )

    return updated_calendar


@router.delete("/{calendar_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar(
    calendar_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """刪除日曆"""
    # 檢查權限
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

    calendar = await calendar_crud.get(db, id=calendar_id)
    if not calendar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar not found"
        )

    # 防止刪除預設日曆（如果是唯一日曆則允許）
    if calendar.is_default:
        calendars_count = len(await calendar_crud.get_by_owner(
            db,
            owner_id=current_user.id
        ))
        if calendars_count > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete default calendar. Please set another calendar as default first."
            )

    await calendar_crud.remove(db, id=calendar_id)
