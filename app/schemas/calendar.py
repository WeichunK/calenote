"""
日曆 (Calendar) Pydantic Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class CalendarBase(BaseModel):
    """Calendar 基礎 schema"""
    name: str = Field(..., min_length=1, max_length=100, description="日曆名稱")
    description: Optional[str] = Field(None, description="日曆描述")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="HEX 顏色代碼")
    icon: Optional[str] = Field(None, max_length=50, description="圖示名稱")
    is_default: bool = Field(False, description="是否為預設日曆")
    is_shared: bool = Field(False, description="是否共享")


class CalendarCreate(CalendarBase):
    """創建日曆 schema"""
    pass


class CalendarUpdate(BaseModel):
    """更新日曆 schema（所有欄位可選）"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)
    is_default: Optional[bool] = None
    is_shared: Optional[bool] = None

    model_config = ConfigDict(extra="forbid")


class CalendarInDB(CalendarBase):
    """資料庫中的日曆 schema"""
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CalendarResponse(CalendarInDB):
    """API 回應的日曆 schema"""
    pass


class CalendarWithStats(CalendarInDB):
    """包含統計資料的日曆 schema"""
    total_entries: int = Field(0, description="總記事數")
    total_tasks: int = Field(0, description="總任務數")
    completed_entries: int = Field(0, description="已完成記事數")

    model_config = ConfigDict(from_attributes=True)


class CalendarList(BaseModel):
    """日曆列表回應"""
    calendars: list[CalendarWithStats]
    total: int


class SetDefaultCalendarRequest(BaseModel):
    """設定預設日曆請求"""
    calendar_id: UUID


class ShareCalendarRequest(BaseModel):
    """共享日曆請求"""
    user_ids: list[UUID] = Field(..., min_length=1, description="要共享給的使用者 ID 列表")
    can_edit: bool = Field(False, description="是否允許編輯")
