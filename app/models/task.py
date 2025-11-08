"""
任務 (Task) 資料模型
"""
from datetime import datetime, date, timezone
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy import String, Text, Integer, TIMESTAMP, Date, CheckConstraint, Computed, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core.database import Base


class Task(Base):
    """任務模型 - 記事的容器"""

    __tablename__ = "tasks"

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

    # 基本資訊
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ❌ 注意：任務沒有 timestamp 欄位
    # ✅ 時間資訊來自任務內的記事

    # 可選：截止日期（用於提醒和排序）
    due_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        index=True
    )

    # 任務狀態
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False,
        index=True
    )  # active, completed, archived, cancelled

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )

    # 進度計算（由觸發器自動更新）
    total_entries: Mapped[int] = mapped_column(Integer, default=0)
    completed_entries: Mapped[int] = mapped_column(Integer, default=0)

    # 完成百分比（計算欄位）
    # NOTE: This depends on database trigger to update total_entries and completed_entries
    completion_percentage: Mapped[int] = mapped_column(
        Integer,
        Computed(
            """
            CASE
                WHEN total_entries = 0 THEN 0
                ELSE (completed_entries * 100 / total_entries)
            END
            """
        ),
        nullable=False
    )

    # 視覺
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # 排序位置
    position: Mapped[int] = mapped_column(Integer, default=0)

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

    # 關聯
    calendar = relationship("Calendar", back_populates="tasks")
    entries = relationship(
        "Entry",
        back_populates="task",
        order_by="Entry.position_in_task"
    )

    # 約束
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'completed', 'archived', 'cancelled')",
            name="valid_status"
        ),
    )

    def __repr__(self):
        return f"<Task(id={self.id}, title={self.title}, status={self.status})>"

    @property
    def is_completed(self) -> bool:
        """是否已完成"""
        return self.status == "completed"

    @property
    def is_overdue(self) -> bool:
        """是否逾期"""
        if self.status == "completed" or self.due_date is None:
            return False
        return date.today() > self.due_date

    @property
    def progress(self) -> float:
        """完成進度 (0.0 - 1.0)"""
        if self.total_entries == 0:
            return 0.0
        return self.completed_entries / self.total_entries
