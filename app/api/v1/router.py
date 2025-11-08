"""
API v1 路由匯總
"""
from fastapi import APIRouter

from app.api.v1 import entries, calendars, tasks, auth

api_router = APIRouter()

# 註冊各個子路由
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(entries.router, prefix="/entries", tags=["entries"])
api_router.include_router(calendars.router, prefix="/calendars", tags=["calendars"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
