# API 使用範例

本文檔提供所有 API endpoints 的實際使用範例。

## 基礎資訊

- **Base URL**: `http://localhost:8000`
- **API Version**: `v1`
- **API Prefix**: `/api/v1`
- **認證方式**: JWT Bearer Token

## 目錄

1. [認證 API](#認證-api)
2. [日曆 API](#日曆-api)
3. [記事 API](#記事-api)
4. [任務 API](#任務-api)
5. [WebSocket](#websocket)

---

## 認證 API

### 1. 註冊新使用者

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepass123",
    "password_confirm": "securepass123"
  }'
```

**回應範例**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "testuser",
    "is_active": true,
    "is_superuser": false,
    "created_at": "2025-11-09T12:00:00Z",
    "updated_at": "2025-11-09T12:00:00Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### 2. 登入

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

### 3. 刷新 Token

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### 4. 取得當前使用者資訊

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. 修改密碼

```bash
curl -X POST http://localhost:8000/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "oldpass123",
    "new_password": "newpass456",
    "new_password_confirm": "newpass456"
  }'
```

---

## 日曆 API

> **注意**: 所有日曆 API 都需要 Bearer Token 認證

### 1. 創建日曆

```bash
curl -X POST http://localhost:8000/api/v1/calendars/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "工作日曆",
    "description": "工作相關的記事和任務",
    "color": "#3B82F6",
    "icon": "briefcase"
  }'
```

### 2. 列出所有日曆

```bash
curl -X GET http://localhost:8000/api/v1/calendars/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**回應範例**:
```json
{
  "calendars": [
    {
      "id": "calendar-uuid",
      "name": "工作日曆",
      "description": "工作相關的記事和任務",
      "color": "#3B82F6",
      "icon": "briefcase",
      "is_default": true,
      "is_shared": false,
      "total_entries": 15,
      "total_tasks": 3,
      "completed_entries": 8,
      "owner_id": "user-uuid",
      "created_at": "2025-11-09T12:00:00Z",
      "updated_at": "2025-11-09T12:00:00Z"
    }
  ],
  "total": 1
}
```

### 3. 取得預設日曆

```bash
curl -X GET http://localhost:8000/api/v1/calendars/default \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. 設定預設日曆

```bash
curl -X POST http://localhost:8000/api/v1/calendars/default \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendar_id": "calendar-uuid"
  }'
```

### 5. 取得單一日曆（含統計）

```bash
curl -X GET http://localhost:8000/api/v1/calendars/{calendar_id} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. 更新日曆

```bash
curl -X PATCH http://localhost:8000/api/v1/calendars/{calendar_id} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新名稱",
    "color": "#10B981"
  }'
```

### 7. 刪除日曆

```bash
curl -X DELETE http://localhost:8000/api/v1/calendars/{calendar_id} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 記事 API

### 1. 創建記事

```bash
curl -X POST http://localhost:8000/api/v1/entries/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendar_id": "calendar-uuid",
    "title": "完成專案提案",
    "content": "需要準備 PPT 和相關文件",
    "timestamp": "2025-11-10T14:00:00Z",
    "entry_type": "task",
    "priority": 2,
    "tags": ["工作", "重要"]
  }'
```

### 2. 列出記事（支持篩選）

```bash
# 基本列表
curl -X GET "http://localhost:8000/api/v1/entries/?calendar_id=calendar-uuid" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 只顯示未完成的記事
curl -X GET "http://localhost:8000/api/v1/entries/?calendar_id=calendar-uuid&is_completed=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 篩選特定日期範圍
curl -X GET "http://localhost:8000/api/v1/entries/?calendar_id=calendar-uuid&start_date=2025-11-01&end_date=2025-11-30" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 只顯示沒有時間戳的記事（inbox）
curl -X GET "http://localhost:8000/api/v1/entries/?calendar_id=calendar-uuid&has_timestamp=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. 取得單一記事

```bash
curl -X GET http://localhost:8000/api/v1/entries/{entry_id} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. 更新記事

```bash
curl -X PATCH http://localhost:8000/api/v1/entries/{entry_id} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新後的標題",
    "priority": 3
  }'
```

### 5. 完成記事

```bash
curl -X POST http://localhost:8000/api/v1/entries/{entry_id}/complete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. 取消完成

```bash
curl -X POST http://localhost:8000/api/v1/entries/{entry_id}/uncomplete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. 將記事加入任務

```bash
curl -X POST http://localhost:8000/api/v1/entries/{entry_id}/add-to-task \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-uuid",
    "position": 0
  }'
```

### 8. 從任務中移除記事

```bash
curl -X POST http://localhost:8000/api/v1/entries/{entry_id}/remove-from-task \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 9. 批量更新記事

```bash
curl -X PATCH http://localhost:8000/api/v1/entries/batch \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_ids": ["entry-uuid-1", "entry-uuid-2"],
    "update_data": {
      "priority": 2,
      "tags": ["批量更新"]
    }
  }'
```

### 10. 批量刪除記事

```bash
curl -X DELETE http://localhost:8000/api/v1/entries/batch \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_ids": ["entry-uuid-1", "entry-uuid-2"]
  }'
```

---

## 任務 API

### 1. 創建任務

```bash
curl -X POST http://localhost:8000/api/v1/tasks/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calendar_id": "calendar-uuid",
    "title": "Q4 專案規劃",
    "description": "完成第四季度的專案規劃和資源分配",
    "due_date": "2025-12-31",
    "color": "#EF4444",
    "icon": "target"
  }'
```

**注意**: 任務遵循 entry-first 架構，沒有 `timestamp` 欄位。時間資訊來自任務內的記事。

### 2. 列出任務（支持篩選）

```bash
# 基本列表
curl -X GET "http://localhost:8000/api/v1/tasks/?calendar_id=calendar-uuid" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 只顯示進行中的任務
curl -X GET "http://localhost:8000/api/v1/tasks/?calendar_id=calendar-uuid&status=active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 只顯示逾期的任務
curl -X GET "http://localhost:8000/api/v1/tasks/?calendar_id=calendar-uuid&is_overdue=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. 取得單一任務（含記事列表）

```bash
curl -X GET http://localhost:8000/api/v1/tasks/{task_id} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**回應範例**:
```json
{
  "id": "task-uuid",
  "calendar_id": "calendar-uuid",
  "title": "Q4 專案規劃",
  "description": "完成第四季度的專案規劃和資源分配",
  "due_date": "2025-12-31",
  "status": "active",
  "completed_at": null,
  "total_entries": 5,
  "completed_entries": 2,
  "completion_percentage": 40,
  "color": "#EF4444",
  "icon": "target",
  "position": 0,
  "created_by": "user-uuid",
  "created_at": "2025-11-09T12:00:00Z",
  "updated_at": "2025-11-09T12:00:00Z",
  "entries": [
    {
      "id": "entry-uuid-1",
      "title": "市場調研",
      "is_completed": true,
      "timestamp": "2025-11-10T09:00:00Z",
      "position_in_task": 0
    },
    {
      "id": "entry-uuid-2",
      "title": "需求分析",
      "is_completed": true,
      "timestamp": "2025-11-11T14:00:00Z",
      "position_in_task": 1
    },
    {
      "id": "entry-uuid-3",
      "title": "資源規劃",
      "is_completed": false,
      "timestamp": null,
      "position_in_task": 2
    }
  ]
}
```

### 4. 更新任務

```bash
curl -X PATCH http://localhost:8000/api/v1/tasks/{task_id} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新後的任務標題",
    "status": "active"
  }'
```

### 5. 完成任務

```bash
# 只完成任務本身
curl -X POST http://localhost:8000/api/v1/tasks/{task_id}/complete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mark_all_entries_complete": false
  }'

# 完成任務並同時完成所有記事
curl -X POST http://localhost:8000/api/v1/tasks/{task_id}/complete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mark_all_entries_complete": true
  }'
```

### 6. 重新開啟任務

```bash
curl -X POST http://localhost:8000/api/v1/tasks/{task_id}/reopen \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. 封存任務

```bash
curl -X POST http://localhost:8000/api/v1/tasks/{task_id}/archive \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. 取得任務統計

```bash
curl -X GET http://localhost:8000/api/v1/tasks/{task_id}/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**回應範例**:
```json
{
  "total_entries": 5,
  "completed_entries": 2,
  "pending_entries": 3,
  "completion_percentage": 40,
  "is_completed": false,
  "is_overdue": false
}
```

### 9. 重新排序任務

```bash
curl -X POST http://localhost:8000/api/v1/tasks/reorder \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_orders": [
      {"task_id": "task-uuid-1", "position": 0},
      {"task_id": "task-uuid-2", "position": 1},
      {"task_id": "task-uuid-3", "position": 2}
    ]
  }'
```

### 10. 批量更新任務

```bash
curl -X PATCH http://localhost:8000/api/v1/tasks/batch \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_ids": ["task-uuid-1", "task-uuid-2"],
    "update_data": {
      "status": "archived"
    }
  }'
```

### 11. 批量刪除任務

```bash
curl -X DELETE http://localhost:8000/api/v1/tasks/batch \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_ids": ["task-uuid-1", "task-uuid-2"]
  }'
```

---

## WebSocket

### 日曆即時同步

WebSocket 用於即時同步日曆中的更新。

**JavaScript 範例**:

```javascript
// 建立 WebSocket 連接
const calendarId = 'your-calendar-uuid';
const accessToken = 'your-access-token';

const ws = new WebSocket(
  `ws://localhost:8000/ws/calendar/${calendarId}?token=${accessToken}`
);

// 連接建立
ws.onopen = () => {
  console.log('WebSocket 連接已建立');
};

// 接收訊息
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到更新:', message);

  switch (message.type) {
    case 'connection:established':
      console.log('連接成功，訂閱者數量:', message.data.subscribers);
      break;

    case 'entry:created':
      console.log('新記事:', message.data);
      // 更新 UI，添加新記事到列表
      break;

    case 'entry:updated':
      console.log('記事更新:', message.data);
      // 更新 UI，更新記事資料
      break;

    case 'entry:completed':
      console.log('記事完成:', message.data);
      // 更新 UI，標記為完成
      break;

    case 'task:updated':
      console.log('任務更新:', message.data);
      // 更新 UI，更新任務資料
      break;

    case 'user:typing':
      console.log('使用者正在輸入:', message.data);
      // 顯示「正在輸入」提示
      break;

    case 'user:disconnected':
      console.log('使用者離線:', message.data);
      break;
  }
};

// 發送心跳
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000); // 每 30 秒

// 發送「正在輸入」事件
function sendTypingIndicator(entryId) {
  ws.send(JSON.stringify({
    type: 'typing',
    entry_id: entryId
  }));
}

// 關閉連接
ws.onclose = () => {
  console.log('WebSocket 連接已關閉');
};

// 錯誤處理
ws.onerror = (error) => {
  console.error('WebSocket 錯誤:', error);
};
```

**Python 範例** (使用 websockets):

```python
import asyncio
import websockets
import json

async def connect_to_calendar():
    calendar_id = "your-calendar-uuid"
    access_token = "your-access-token"
    uri = f"ws://localhost:8000/ws/calendar/{calendar_id}?token={access_token}"

    async with websockets.connect(uri) as websocket:
        print("WebSocket 連接已建立")

        # 接收訊息
        async for message in websocket:
            data = json.loads(message)
            print(f"收到訊息: {data}")

            # 處理不同類型的訊息
            if data['type'] == 'entry:created':
                print(f"新記事: {data['data']}")

asyncio.run(connect_to_calendar())
```

---

## 完整工作流程範例

以下是一個完整的使用流程，從註冊到創建任務並添加記事：

```bash
# 1. 註冊使用者
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "username": "demouser",
    "password": "demo123456",
    "password_confirm": "demo123456"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.access_token')
echo "Access Token: $TOKEN"

# 2. 創建日曆
CALENDAR_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/calendars/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的工作日曆",
    "color": "#3B82F6"
  }')

CALENDAR_ID=$(echo $CALENDAR_RESPONSE | jq -r '.id')
echo "Calendar ID: $CALENDAR_ID"

# 3. 創建任務
TASK_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/tasks/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"calendar_id\": \"$CALENDAR_ID\",
    \"title\": \"完成專案\",
    \"description\": \"本週需要完成的專案任務\"
  }")

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')
echo "Task ID: $TASK_ID"

# 4. 創建記事並加入任務
ENTRY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/entries/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"calendar_id\": \"$CALENDAR_ID\",
    \"title\": \"撰寫文檔\",
    \"content\": \"完成技術文檔撰寫\",
    \"timestamp\": \"2025-11-10T14:00:00Z\",
    \"priority\": 2
  }")

ENTRY_ID=$(echo $ENTRY_RESPONSE | jq -r '.id')
echo "Entry ID: $ENTRY_ID"

# 5. 將記事加入任務
curl -X POST http://localhost:8000/api/v1/entries/$ENTRY_ID/add-to-task \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"task_id\": \"$TASK_ID\"
  }"

# 6. 查看任務（含記事列表）
curl -X GET http://localhost:8000/api/v1/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# 7. 完成記事
curl -X POST http://localhost:8000/api/v1/entries/$ENTRY_ID/complete \
  -H "Authorization: Bearer $TOKEN"

# 8. 查看任務統計
curl -X GET http://localhost:8000/api/v1/tasks/$TASK_ID/stats \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 互動式 API 文檔

訪問以下 URL 查看自動生成的互動式 API 文檔：

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

這些文檔提供：
- 所有 endpoints 的詳細說明
- Request/Response schema
- 直接在瀏覽器中測試 API 的功能

---

## 錯誤處理

所有 API 在發生錯誤時會返回標準的 HTTP 狀態碼和錯誤訊息：

```json
{
  "detail": "錯誤訊息描述"
}
```

常見狀態碼：
- `200 OK`: 請求成功
- `201 Created`: 資源創建成功
- `204 No Content`: 刪除成功
- `400 Bad Request`: 請求參數錯誤
- `401 Unauthorized`: 未授權（token 無效或過期）
- `403 Forbidden`: 無權訪問該資源
- `404 Not Found`: 資源不存在
- `500 Internal Server Error`: 伺服器內部錯誤
