"""
Entry Pydantic Schemas
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


# ============================================
# Base Schemas
# ============================================

class EntryBase(BaseModel):
    """Entry base schema"""
    title: str = Field(..., min_length=1, max_length=500)
    content: Optional[str] = None
    entry_type: str = Field(default="note", pattern="^(note|task|event)$")
    timestamp: Optional[datetime] = None
    end_timestamp: Optional[datetime] = None
    is_all_day: bool = False
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    tags: Optional[List[str]] = None
    priority: int = Field(default=0, ge=0, le=3)
    reminder_time: Optional[datetime] = None
    recurrence_rule: Optional[str] = None


class EntryCreate(EntryBase):
    """Entry creation schema"""
    calendar_id: UUID
    task_id: Optional[UUID] = None
    position_in_task: Optional[int] = None


class EntryUpdate(BaseModel):
    """Entry update schema (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    entry_type: Optional[str] = Field(None, pattern="^(note|task|event)$")
    timestamp: Optional[datetime] = None
    end_timestamp: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    tags: Optional[List[str]] = None
    priority: Optional[int] = Field(None, ge=0, le=3)
    reminder_time: Optional[datetime] = None
    recurrence_rule: Optional[str] = None
    position_in_task: Optional[int] = None

    model_config = ConfigDict(extra="forbid")


class EntryInDB(EntryBase):
    """Entry in database schema"""
    id: UUID
    calendar_id: UUID
    task_id: Optional[UUID] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    completed_by: Optional[UUID] = None
    position_in_task: Optional[int] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    last_modified_by: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class EntryWithStats(EntryInDB):
    """Entry with additional statistics"""
    is_scheduled: bool = False
    is_overdue: bool = False

    model_config = ConfigDict(from_attributes=True)


class EntryDetail(EntryInDB):
    """Entry detail with relationships (attachments, comments)"""
    # TODO: Add when Attachment and Comment models are created
    # attachments: List[AttachmentInDB] = []
    # comments: List[CommentInDB] = []

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Operation Schemas
# ============================================

class EntryComplete(BaseModel):
    """Mark entry as complete/incomplete"""
    is_completed: bool


class EntryAddToTask(BaseModel):
    """Add entry to task"""
    task_id: UUID
    position: Optional[int] = None


class EntryFilter(BaseModel):
    """Entry filter parameters"""
    calendar_id: UUID
    task_id: Optional[UUID] = None
    entry_type: Optional[str] = None
    is_completed: Optional[bool] = None
    has_timestamp: Optional[bool] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = None


class EntrySort(BaseModel):
    """Entry sort parameters"""
    sort_by: str = "created_at"
    order: str = "desc"


class EntryStats(BaseModel):
    """Entry statistics for a calendar"""
    total_entries: int
    completed_entries: int
    scheduled_entries: int
    unscheduled_entries: int
    overdue_entries: int
    entries_by_type: dict[str, int]
    entries_by_priority: dict[int, int]


# ============================================
# Batch Operation Schemas
# ============================================

class EntryBatchUpdate(BaseModel):
    """Batch update entries"""
    entry_ids: List[UUID] = Field(..., min_length=1)
    updates: EntryUpdate


class EntryBatchAddToTask(BaseModel):
    """Batch add entries to task"""
    entry_ids: List[UUID] = Field(..., min_length=1)
    task_id: UUID


class EntryBatchDelete(BaseModel):
    """Batch delete entries"""
    entry_ids: List[UUID] = Field(..., min_length=1)
