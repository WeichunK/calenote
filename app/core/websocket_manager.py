"""
WebSocket 管理器
用於處理即時同步和推播通知
"""
from typing import Dict, Set
from uuid import UUID
from fastapi import WebSocket
import json
import asyncio


class ConnectionManager:
    """WebSocket 連接管理器"""
    
    def __init__(self):
        # 存儲連接：{user_id: {calendar_id: WebSocket}}
        self.active_connections: Dict[UUID, Dict[UUID, WebSocket]] = {}
        
        # 存儲日曆訂閱：{calendar_id: Set[user_id]}
        self.calendar_subscribers: Dict[UUID, Set[UUID]] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        user_id: UUID,
        calendar_id: UUID
    ):
        """接受新連接"""
        await websocket.accept()
        
        # 添加到活躍連接
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
        self.active_connections[user_id][calendar_id] = websocket
        
        # 添加到日曆訂閱
        if calendar_id not in self.calendar_subscribers:
            self.calendar_subscribers[calendar_id] = set()
        self.calendar_subscribers[calendar_id].add(user_id)
        
        print(f"✅ User {user_id} connected to calendar {calendar_id}")
    
    def disconnect(self, user_id: UUID, calendar_id: UUID):
        """斷開連接"""
        # 從活躍連接中移除
        if user_id in self.active_connections:
            if calendar_id in self.active_connections[user_id]:
                del self.active_connections[user_id][calendar_id]
            
            # 如果用戶沒有其他連接，移除用戶
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # 從日曆訂閱中移除
        if calendar_id in self.calendar_subscribers:
            self.calendar_subscribers[calendar_id].discard(user_id)
            
            # 如果日曆沒有訂閱者，移除日曆
            if not self.calendar_subscribers[calendar_id]:
                del self.calendar_subscribers[calendar_id]
        
        print(f"❌ User {user_id} disconnected from calendar {calendar_id}")
    
    async def send_personal_message(
        self,
        message: dict,
        user_id: UUID,
        calendar_id: UUID
    ):
        """發送個人消息"""
        if user_id in self.active_connections:
            if calendar_id in self.active_connections[user_id]:
                websocket = self.active_connections[user_id][calendar_id]
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    print(f"Error sending message: {e}")
                    self.disconnect(user_id, calendar_id)
    
    async def broadcast_to_calendar(
        self,
        calendar_id: UUID,
        message: dict,
        exclude_user: UUID = None
    ):
        """
        廣播消息給日曆的所有訂閱者
        
        Args:
            calendar_id: 日曆 ID
            message: 要發送的消息
            exclude_user: 排除的用戶（通常是觸發變更的用戶）
        """
        if calendar_id not in self.calendar_subscribers:
            return
        
        # 取得所有訂閱者
        subscribers = self.calendar_subscribers[calendar_id].copy()
        
        # 排除指定用戶
        if exclude_user:
            subscribers.discard(exclude_user)
        
        # 廣播消息
        disconnected_users = []
        for user_id in subscribers:
            if user_id in self.active_connections:
                if calendar_id in self.active_connections[user_id]:
                    websocket = self.active_connections[user_id][calendar_id]
                    try:
                        await websocket.send_json(message)
                    except Exception as e:
                        print(f"Error broadcasting to {user_id}: {e}")
                        disconnected_users.append((user_id, calendar_id))
        
        # 清理斷開的連接
        for user_id, cal_id in disconnected_users:
            self.disconnect(user_id, cal_id)
    
    async def broadcast_to_user(
        self,
        user_id: UUID,
        message: dict
    ):
        """發送消息給用戶的所有連接"""
        if user_id not in self.active_connections:
            return
        
        disconnected_calendars = []
        for calendar_id, websocket in self.active_connections[user_id].items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to user {user_id}: {e}")
                disconnected_calendars.append(calendar_id)
        
        # 清理斷開的連接
        for calendar_id in disconnected_calendars:
            self.disconnect(user_id, calendar_id)
    
    def get_calendar_subscriber_count(self, calendar_id: UUID) -> int:
        """取得日曆的訂閱者數量"""
        if calendar_id not in self.calendar_subscribers:
            return 0
        return len(self.calendar_subscribers[calendar_id])
    
    def get_user_connections(self, user_id: UUID) -> int:
        """取得用戶的連接數量"""
        if user_id not in self.active_connections:
            return 0
        return len(self.active_connections[user_id])


# 全局實例
manager = ConnectionManager()


# ============================================
# 輔助函數
# ============================================

async def notify_entry_change(
    calendar_id: UUID,
    change_type: str,  # "created", "updated", "deleted", "completed"
    data: dict,
    exclude_user: UUID = None
):
    """
    通知記事變更
    
    使用範例：
    await notify_entry_change(
        calendar_id=entry.calendar_id,
        change_type="created",
        data={"id": str(entry.id), "title": entry.title},
        exclude_user=current_user.id
    )
    """
    message = {
        "type": f"entry:{change_type}",
        "data": data,
        "timestamp": asyncio.get_event_loop().time()
    }
    
    await manager.broadcast_to_calendar(
        calendar_id=calendar_id,
        message=message,
        exclude_user=exclude_user
    )


async def notify_task_change(
    calendar_id: UUID,
    change_type: str,
    data: dict,
    exclude_user: UUID = None
):
    """通知任務變更"""
    message = {
        "type": f"task:{change_type}",
        "data": data,
        "timestamp": asyncio.get_event_loop().time()
    }
    
    await manager.broadcast_to_calendar(
        calendar_id=calendar_id,
        message=message,
        exclude_user=exclude_user
    )


async def notify_user(
    user_id: UUID,
    notification_type: str,
    data: dict
):
    """發送個人通知"""
    message = {
        "type": f"notification:{notification_type}",
        "data": data,
        "timestamp": asyncio.get_event_loop().time()
    }
    
    await manager.broadcast_to_user(user_id=user_id, message=message)
