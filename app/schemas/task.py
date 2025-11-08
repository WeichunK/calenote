"""
任務 (Task) Pydantic Schemas
"""
from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class TaskBase(BaseModel):
    """Task 基礎 schema"""
    title: str = Field(..., min_length=1, max_length=300, description="任務標題")
    description: Optional[str] = Field(None, description="任務描述")
    due_date: Optional[date] = Field(None, description="截止日期")
    status: str = Field("active", pattern=r'^(active|completed|archived|cancelled)$', description="任務狀態")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="HEX 顏色代碼")
    icon: Optional[str] = Field(None, max_length=50, description="圖示名稱")
    position: int = Field(0, ge=0, description="排序位置")


class TaskCreate(BaseModel):
    """創建任務 schema"""
    calendar_id: UUID
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    due_date: Optional[date] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)
    position: int = Field(0, ge=0)


class TaskUpdate(BaseModel):
    """更新任務 schema（所有欄位可選）"""
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = Field(None, pattern=r'^(active|completed|archived|cancelled)$')
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)
    position: Optional[int] = Field(None, ge=0)

    model_config = ConfigDict(extra="forbid")


class TaskInDB(TaskBase):
    """資料庫中的任務 schema"""
    id: UUID
    calendar_id: UUID
    completed_at: Optional[datetime]
    total_entries: int
    completed_entries: int
    completion_percentage: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(TaskInDB):
    """API 回應的任務 schema"""
    pass


class TaskWithEntries(TaskInDB):
    """包含記事列表的任務 schema

    Note: entries field is defined using update_forward_refs() to avoid circular import
    """
    entries: list = Field(default_factory=list, description="任務中的記事列表")

    model_config = ConfigDict(from_attributes=True)


class TaskStats(BaseModel):
    """任務統計資料"""
    total_entries: int = Field(0, description="總記事數")
    completed_entries: int = Field(0, description="已完成記事數")
    pending_entries: int = Field(0, description="待完成記事數")
    completion_percentage: int = Field(0, ge=0, le=100, description="完成百分比")
    is_completed: bool = Field(False, description="任務是否完成")
    is_overdue: bool = Field(False, description="任務是否逾期")


class TaskFilter(BaseModel):
    """任務篩選參數"""
    calendar_id: UUID
    status: Optional[str] = Field(None, pattern=r'^(active|completed|archived|cancelled)$')
    is_overdue: Optional[bool] = None
    has_due_date: Optional[bool] = None


class TaskSort(BaseModel):
    """任務排序參數"""
    sort_by: str = Field("position", pattern=r'^(position|due_date|created_at|updated_at|completion_percentage)$')
    order: str = Field("asc", pattern=r'^(asc|desc)$')


class TaskList(BaseModel):
    """任務列表回應"""
    tasks: list[TaskResponse]
    total: int


class TaskCompleteRequest(BaseModel):
    """完成任務請求"""
    mark_all_entries_complete: bool = Field(False, description="是否同時標記所有記事為完成")


class TaskBatchUpdate(BaseModel):
    """批量更新任務"""
    task_ids: list[UUID] = Field(..., min_length=1, max_length=100)
    update_data: TaskUpdate


class TaskBatchDelete(BaseModel):
    """批量刪除任務"""
    task_ids: list[UUID] = Field(..., min_length=1, max_length=100)


class TaskReorderRequest(BaseModel):
    """重新排序任務請求"""
    task_orders: list[dict[str, int]] = Field(..., description="任務 ID 和新位置的映射列表")
    # Example: [{"task_id": "uuid", "position": 0}, {"task_id": "uuid", "position": 1}]
