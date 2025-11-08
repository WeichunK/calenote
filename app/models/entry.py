"""
記事 (Entry) 資料模型
"""
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID, uuid4
from sqlalchemy import String, Text, Boolean, Integer, TIMESTAMP, ARRAY, CheckConstraint, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core.database import Base


class Entry(Base):
    """記事模型 - 系統的第一公民"""

    __tablename__ = "entries"

    # 主鍵
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )

    # 外鍵
    calendar_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("calendars.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    task_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # 基本資訊
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 類型與狀態
    entry_type: Mapped[str] = mapped_column(
        String(20),
        default="note",
        nullable=False
    )  # note, task, event

    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    completed_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True
    )

    # 時間戳（核心欄位）
    timestamp: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
        index=True
    )
    end_timestamp: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )
    is_all_day: Mapped[bool] = mapped_column(Boolean, default=False)

    # 任務相關
    position_in_task: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # 視覺與分類
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)

    # 提醒
    reminder_time: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )
    recurrence_rule: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 元資料
    created_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    last_modified_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True
    )

    # 關聯
    calendar = relationship("Calendar", back_populates="entries")
    task = relationship("Task", back_populates="entries")
    # TODO: Implement when Attachment and Comment models are created
    # attachments = relationship("Attachment", back_populates="entry", cascade="all, delete-orphan")
    # comments = relationship("Comment", back_populates="entry", cascade="all, delete-orphan")

    # 約束
    __table_args__ = (
        CheckConstraint(
            "end_timestamp IS NULL OR end_timestamp >= timestamp",
            name="valid_time_range"
        ),
        CheckConstraint(
            "entry_type IN ('note', 'task', 'event')",
            name="valid_entry_type"
        ),
        CheckConstraint(
            "priority BETWEEN 0 AND 3",
            name="valid_priority"
        ),
    )

    def __repr__(self):
        return f"<Entry(id={self.id}, title={self.title}, type={self.entry_type})>"

    @property
    def is_scheduled(self) -> bool:
        """是否已排程（有時間戳）"""
        return self.timestamp is not None

    @property
    def is_overdue(self) -> bool:
        """是否逾期（針對任務類型）"""
        if self.entry_type != "task" or self.is_completed:
            return False
        if self.timestamp is None:
            return False
        return datetime.now(timezone.utc) > self.timestamp
