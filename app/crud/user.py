"""
使用者 (User) CRUD 操作
"""
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.user import User
from app.core.security import get_password_hash, verify_password


class CRUDUser(CRUDBase[User, dict, dict]):
    """User CRUD 操作"""

    async def get_by_email(
        self,
        db: AsyncSession,
        *,
        email: str
    ) -> Optional[User]:
        """根據 email 取得使用者"""
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_username(
        self,
        db: AsyncSession,
        *,
        username: str
    ) -> Optional[User]:
        """根據 username 取得使用者"""
        result = await db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def create_user(
        self,
        db: AsyncSession,
        *,
        email: str,
        username: str,
        password: str
    ) -> User:
        """創建新使用者"""
        hashed_password = get_password_hash(password)

        db_user = User(
            email=email,
            username=username,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False
        )

        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    async def authenticate(
        self,
        db: AsyncSession,
        *,
        email: str,
        password: str
    ) -> Optional[User]:
        """驗證使用者登入"""
        user = await self.get_by_email(db, email=email)

        if not user:
            return None

        if not verify_password(password, user.hashed_password):
            return None

        if not user.is_active:
            return None

        return user

    async def update_password(
        self,
        db: AsyncSession,
        *,
        user: User,
        new_password: str
    ) -> User:
        """更新使用者密碼"""
        user.hashed_password = get_password_hash(new_password)
        await db.commit()
        await db.refresh(user)
        return user

    async def is_active(
        self,
        user: User
    ) -> bool:
        """檢查使用者是否啟用"""
        return user.is_active

    async def is_superuser(
        self,
        user: User
    ) -> bool:
        """檢查使用者是否為超級使用者"""
        return user.is_superuser

    async def deactivate_user(
        self,
        db: AsyncSession,
        *,
        user_id: UUID
    ) -> Optional[User]:
        """停用使用者"""
        user = await self.get(db, id=user_id)
        if not user:
            return None

        user.is_active = False
        await db.commit()
        await db.refresh(user)
        return user

    async def activate_user(
        self,
        db: AsyncSession,
        *,
        user_id: UUID
    ) -> Optional[User]:
        """啟用使用者"""
        user = await self.get(db, id=user_id)
        if not user:
            return None

        user.is_active = True
        await db.commit()
        await db.refresh(user)
        return user


# 建立單例實例
user_crud = CRUDUser(User)
