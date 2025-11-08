"""
FastAPI 主應用程式
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import engine, Base
from app.core.redis import redis_client
from app.api.v1.router import api_router
from app.api.websocket import websocket_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用程式生命週期管理"""
    # 啟動時
    print("🚀 Starting up...")
    
    # 建立資料庫表格（生產環境應使用 Alembic）
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    
    # 測試 Redis 連接
    await redis_client.ping()
    print("✅ Redis connected")
    
    yield
    
    # 關閉時
    print("🛑 Shutting down...")
    await redis_client.close()


# 建立 FastAPI 應用
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="日曆 + 任務管理系統 API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊路由
app.include_router(api_router, prefix="/api/v1")
app.include_router(websocket_router, prefix="/ws")


@app.get("/")
async def root():
    """健康檢查"""
    return {
        "status": "ok",
        "message": "Calendar App API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """健康檢查端點"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # 開發模式
    )
