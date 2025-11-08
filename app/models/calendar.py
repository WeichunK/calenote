"""
日曆 (Calendar) 資料模型
"""
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import String, Text, Boolean, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core.database import Base


class Calendar(Base):
    """日曆模型 - 使用者的工作區"""

    __tablename__ = "calendars"

    # 主鍵
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )

    # 外鍵
    owner_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # 基本資訊
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # HEX color
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # 設定
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False)

    # 元資料
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
    owner = relationship("User", back_populates="calendars")
    entries = relationship("Entry", back_populates="calendar", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="calendar", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Calendar(id={self.id}, name={self.name}, owner_id={self.owner_id})>"
