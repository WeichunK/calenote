"""
WebSocket 路由
處理即時連接
"""
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.websocket_manager import manager
from app.core.database import get_db
from app.core.security import decode_token
from app.crud.calendar import calendar_crud


router = APIRouter()
# Alias for backward compatibility
websocket_router = router


@router.websocket("/calendar/{calendar_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    calendar_id: UUID,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket 連接端點
    
    前端連接方式：
    ```javascript
    const ws = new WebSocket(
        `ws://localhost:8000/ws/calendar/${calendarId}?token=${accessToken}`
    );
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('收到更新:', message);
        
        // 根據類型處理
        if (message.type === 'entry:created') {
            // 新增記事到本地狀態
        } else if (message.type === 'entry:updated') {
            // 更新記事
        }
    };
    ```
    """
    
    # 驗證 token
    try:
        payload = decode_token(token)
        user_id = UUID(payload.get("sub"))
    except Exception as e:
        print(f"❌ WebSocket auth failed: {e}")
        await websocket.close(code=1008, reason="Invalid token")
        return

    # 驗證日曆存取權限
    has_access = await calendar_crud.check_access(
        db,
        calendar_id=calendar_id,
        user_id=user_id
    )

    if not has_access:
        print(f"❌ User {user_id} has no access to calendar {calendar_id}")
        await websocket.close(code=1008, reason="No access to calendar")
        return
    
    # 接受連接
    await manager.connect(websocket, user_id, calendar_id)
    
    # 發送歡迎消息
    await websocket.send_json({
        "type": "connection:established",
        "data": {
            "calendar_id": str(calendar_id),
            "user_id": str(user_id),
            "subscribers": manager.get_calendar_subscriber_count(calendar_id)
        }
    })
    
    try:
        # 保持連接並監聽客戶端消息
        while True:
            data = await websocket.receive_json()
            
            # 處理不同類型的客戶端消息
            message_type = data.get("type")
            
            if message_type == "ping":
                # 心跳檢測
                await websocket.send_json({"type": "pong"})
            
            elif message_type == "typing":
                # 正在輸入提示（可選功能）
                await manager.broadcast_to_calendar(
                    calendar_id=calendar_id,
                    message={
                        "type": "user:typing",
                        "data": {
                            "user_id": str(user_id),
                            "entry_id": data.get("entry_id")
                        }
                    },
                    exclude_user=user_id
                )
            
            elif message_type == "cursor":
                # 游標位置同步（協作編輯）
                await manager.broadcast_to_calendar(
                    calendar_id=calendar_id,
                    message={
                        "type": "user:cursor",
                        "data": {
                            "user_id": str(user_id),
                            "entry_id": data.get("entry_id"),
                            "position": data.get("position")
                        }
                    },
                    exclude_user=user_id
                )
    
    except WebSocketDisconnect:
        manager.disconnect(user_id, calendar_id)
        
        # 通知其他用戶
        await manager.broadcast_to_calendar(
            calendar_id=calendar_id,
            message={
                "type": "user:disconnected",
                "data": {
                    "user_id": str(user_id),
                    "subscribers": manager.get_calendar_subscriber_count(calendar_id)
                }
            }
        )
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(user_id, calendar_id)


@router.websocket("/notifications")
async def notifications_websocket(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    個人通知 WebSocket
    接收系統通知、提醒等
    """
    
    # 驗證 token
    try:
        payload = decode_token(token)
        user_id = UUID(payload.get("sub"))
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    await websocket.accept()
    
    try:
        while True:
            # 這裡可以接收客戶端的確認訊息
            data = await websocket.receive_json()
            
            if data.get("type") == "notification:read":
                # 標記通知為已讀
                notification_id = data.get("notification_id")
                # TODO: 更新資料庫
                pass
    
    except WebSocketDisconnect:
        print(f"User {user_id} disconnected from notifications")
