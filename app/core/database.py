"""
資料庫連接管理 (異步 SQLAlchemy)
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.config import settings

# 建立異步引擎
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # 檢查連接是否有效
)

# 建立 async session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# 建立 Base 類別（所有 model 的基類）
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    依賴注入：取得資料庫 session

    使用方式:
    ```python
    @router.get("/")
    async def endpoint(db: AsyncSession = Depends(get_db)):
        result = await db.execute(select(Model))
        return result.scalars().all()
    ```

    注意：
    - 此函數只提供 session，不自動提交
    - 路由處理器負責決定何時提交或回滾
    - 使用 CRUD 操作時，在操作完成後手動 commit
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """
    初始化資料庫（建立所有表格）

    注意：生產環境應使用 Alembic 進行遷移，而非直接建立表格
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """關閉資料庫連接"""
    await engine.dispose()
