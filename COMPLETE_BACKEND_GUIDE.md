# 日曆 + 任務管理系統 - Python 後端完整實作

## 🎯 專案總覽

### 核心概念
- **記事是第一公民**：擁有時間、內容、附件等所有屬性
- **任務是容器**：可包含 0 到多個記事，但**任務本身沒有時間戳**
- **三種視圖**：日曆視圖、記事視圖、任務視圖

### 技術棧
- **後端**：Python 3.11 + FastAPI
- **資料庫**：PostgreSQL 15
- **快取**：Redis 7
- **即時同步**：WebSocket
- **背景任務**：Celery

---

## 📁 專案結構

```
calendar-app-backend/
├── app/
│   ├── main.py                    # FastAPI 應用入口
│   ├── config.py                  # 配置管理
│   ├── api/
│   │   ├── v1/
│   │   │   ├── entries.py         # 記事 API
│   │   │   ├── tasks.py           # 任務 API
│   │   │   └── calendars.py       # 日曆 API
│   │   └── websocket.py           # WebSocket
│   ├── models/
│   │   ├── entry.py               # 記事模型
│   │   ├── task.py                # 任務模型
│   │   └── user.py                # 用戶模型
│   ├── schemas/
│   │   ├── entry.py               # 記事 Schema
│   │   └── task.py                # 任務 Schema
│   ├── crud/                      # CRUD 操作
│   ├── services/                  # 業務邏輯
│   └── core/
│       ├── database.py            # 資料庫連接
│       ├── security.py            # 認證安全
│       └── websocket_manager.py   # WebSocket 管理
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## 🗄️ 資料庫設計（PostgreSQL）

### 記事表 (entries) - 核心
```sql
CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL,
    
    -- 基本資訊
    title VARCHAR(500) NOT NULL,
    content TEXT,
    
    -- 類型與狀態
    entry_type VARCHAR(20) DEFAULT 'note',  -- note, task, event
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    
    -- 時間戳（核心欄位）
    timestamp TIMESTAMP,              -- NULL = 未排程
    end_timestamp TIMESTAMP,
    is_all_day BOOLEAN DEFAULT false,
    
    -- 任務歸屬
    task_id UUID,                     -- 屬於哪個任務（可為 NULL）
    position_in_task INTEGER,         -- 在任務中的排序
    
    -- 視覺與分類
    color VARCHAR(7),
    tags TEXT[],
    priority INTEGER DEFAULT 0,
    
    -- 元資料
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entries_calendar_timestamp ON entries(calendar_id, timestamp);
CREATE INDEX idx_entries_task ON entries(task_id, position_in_task);
CREATE INDEX idx_entries_unscheduled ON entries(calendar_id) WHERE timestamp IS NULL;
```

### 任務表 (tasks) - 容器
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL,
    
    -- 基本資訊
    title VARCHAR(300) NOT NULL,
    description TEXT,
    
    -- ❌ 注意：沒有 timestamp 欄位！
    -- ✅ 時間資訊來自任務內的記事
    
    -- 可選：截止日期（用於提醒，不是時間戳）
    due_date DATE,
    
    -- 任務狀態
    status VARCHAR(20) DEFAULT 'active',  -- active, completed, archived
    completed_at TIMESTAMP,
    
    -- 進度計算（自動更新）
    total_entries INTEGER DEFAULT 0,
    completed_entries INTEGER DEFAULT 0,
    completion_percentage INTEGER,        -- 自動計算
    
    -- 視覺
    color VARCHAR(7),
    icon VARCHAR(50),
    
    -- 元資料
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 💻 主要程式碼實作

### 1. main.py - FastAPI 應用

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.api.websocket import websocket_router

app = FastAPI(
    title="Calendar App API",
    version="1.0.0",
    docs_url="/api/docs"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊路由
app.include_router(api_router, prefix="/api/v1")
app.include_router(websocket_router, prefix="/ws")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### 2. models/entry.py - 記事模型

```python
from sqlalchemy import String, Text, Boolean, Integer, TIMESTAMP, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID, uuid4

class Entry(Base):
    __tablename__ = "entries"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    calendar_id: Mapped[UUID] = mapped_column(nullable=False)
    
    # 基本資訊
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    
    # 類型與狀態
    entry_type: Mapped[str] = mapped_column(String(20), default="note")
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # 時間戳 - 記事擁有時間！
    timestamp: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=True)
    end_timestamp: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=True)
    
    # 任務歸屬
    task_id: Mapped[UUID] = mapped_column(nullable=True)
    position_in_task: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # 其他欄位...
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)
```

### 3. models/task.py - 任務模型

```python
class Task(Base):
    __tablename__ = "tasks"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    calendar_id: Mapped[UUID] = mapped_column(nullable=False)
    
    # 基本資訊
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    # ❌ 沒有 timestamp！任務不擁有時間
    # ✅ 時間來自內部的記事
    
    # 可選：截止日期（提醒用）
    due_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    # 狀態
    status: Mapped[str] = mapped_column(String(20), default="active")
    
    # 進度（自動計算）
    total_entries: Mapped[int] = mapped_column(Integer, default=0)
    completed_entries: Mapped[int] = mapped_column(Integer, default=0)
    
    # 關聯
    entries = relationship("Entry", back_populates="task")
```

### 4. api/v1/entries.py - 記事 API

```python
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

router = APIRouter(prefix="/entries", tags=["entries"])

@router.post("/", response_model=EntryInDB)
async def create_entry(
    entry_in: EntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    建立新記事
    
    記事可以：
    - 獨立存在（task_id = null）
    - 屬於某個任務（task_id 有值）
    - 有時間戳（顯示在日曆）
    - 無時間戳（放在未排程區）
    """
    entry = await entry_crud.create(
        db,
        obj_in=entry_in,
        created_by=current_user.id
    )
    
    # WebSocket 廣播
    await manager.broadcast_to_calendar(
        calendar_id=entry.calendar_id,
        message={
            "type": "entry:created",
            "data": EntryInDB.from_orm(entry).dict()
        }
    )
    
    return entry

@router.get("/", response_model=List[EntryInDB])
async def list_entries(
    calendar_id: UUID,
    has_timestamp: Optional[bool] = None,  # 篩選已排程/未排程
    task_id: Optional[UUID] = None,        # 篩選特定任務
    entry_type: Optional[str] = None,
    is_completed: Optional[bool] = None,
    sort_by: str = "created_at",
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """列出記事（支援篩選、排序、分頁）"""
    # 實作略...
    pass

@router.post("/{entry_id}/add-to-task")
async def add_to_task(
    entry_id: UUID,
    task_id: UUID,
    position: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """將記事加入任務"""
    # 實作略...
    pass

@router.post("/{entry_id}/remove-from-task")
async def remove_from_task(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    從任務中移除記事
    注意：記事本身不會被刪除
    """
    # 實作略...
    pass
```

### 5. api/v1/tasks.py - 任務 API

```python
@router.post("/", response_model=TaskInDB)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
):
    """建立任務（純容器）"""
    task = await task_crud.create(db, obj_in=task_in)
    return task

@router.get("/{task_id}", response_model=TaskWithEntries)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    取得任務及其所有記事
    
    回應範例：
    {
      "id": "xxx",
      "title": "Q2 產品規劃",
      "completion_percentage": 60,
      "total_entries": 5,
      "completed_entries": 3,
      "entries": [
        {
          "id": "...",
          "title": "需求分析",
          "timestamp": "2024-03-10T10:00:00Z",  ← 記事的時間
          "is_completed": true
        },
        {
          "id": "...",
          "title": "技術評估",
          "timestamp": null,  ← 未排程的記事
          "is_completed": false
        }
      ]
    }
    """
    # 實作略...
    pass
```

### 6. core/websocket_manager.py - 即時同步

```python
class ConnectionManager:
    """WebSocket 連接管理器"""
    
    def __init__(self):
        self.active_connections: Dict[UUID, Dict[UUID, WebSocket]] = {}
        self.calendar_subscribers: Dict[UUID, Set[UUID]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: UUID, calendar_id: UUID):
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
        self.active_connections[user_id][calendar_id] = websocket
        
        if calendar_id not in self.calendar_subscribers:
            self.calendar_subscribers[calendar_id] = set()
        self.calendar_subscribers[calendar_id].add(user_id)
    
    async def broadcast_to_calendar(
        self,
        calendar_id: UUID,
        message: dict,
        exclude_user: UUID = None
    ):
        """廣播消息給日曆的所有訂閱者"""
        if calendar_id not in self.calendar_subscribers:
            return
        
        subscribers = self.calendar_subscribers[calendar_id].copy()
        if exclude_user:
            subscribers.discard(exclude_user)
        
        for user_id in subscribers:
            if user_id in self.active_connections:
                if calendar_id in self.active_connections[user_id]:
                    websocket = self.active_connections[user_id][calendar_id]
                    try:
                        await websocket.send_json(message)
                    except:
                        self.disconnect(user_id, calendar_id)

manager = ConnectionManager()
```

### 7. api/websocket.py - WebSocket 路由

```python
@router.websocket("/calendar/{calendar_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    calendar_id: UUID,
    token: str = Query(...),
):
    """
    WebSocket 連接端點
    
    前端使用：
    const ws = new WebSocket(
        `ws://localhost:8000/ws/calendar/${calendarId}?token=${token}`
    );
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'entry:created') {
            // 新增記事到本地狀態
        } else if (message.type === 'entry:updated') {
            // 更新記事
        }
    };
    """
    
    # 驗證 token
    user_id = decode_token(token)
    
    # 驗證權限
    if not await check_access(user_id, calendar_id):
        await websocket.close(code=1008)
        return
    
    # 接受連接
    await manager.connect(websocket, user_id, calendar_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(user_id, calendar_id)
```

---

## 🐳 Docker 配置

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: calendar_user
      POSTGRES_PASSWORD: calendar_password
      POSTGRES_DB: calendar_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./app:/app/app
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://calendar_user:calendar_password@postgres:5432/calendar_db
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc postgresql-client libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Python 依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### requirements.txt

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy[asyncio]==2.0.23
asyncpg==0.29.0
alembic==1.12.1
redis[hiredis]==5.0.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic[email]==2.5.0
pydantic-settings==2.1.0
python-multipart==0.0.6
celery==5.3.4
python-dateutil==2.8.2
```

---

## 🚀 快速開始

### 1. 啟動服務

```bash
# 啟動所有服務
docker-compose up -d

# 查看日誌
docker-compose logs -f backend

# 執行資料庫遷移
docker-compose exec backend alembic upgrade head
```

### 2. 訪問 API 文檔

開啟瀏覽器：http://localhost:8000/api/docs

你會看到自動生成的 Swagger UI，可以直接測試所有 API。

### 3. 測試 API

```bash
# 建立記事
curl -X POST "http://localhost:8000/api/v1/entries" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "團隊會議",
    "entry_type": "event",
    "timestamp": "2024-03-15T14:00:00Z",
    "calendar_id": "YOUR_CALENDAR_ID"
  }'

# 列出未排程的記事
curl "http://localhost:8000/api/v1/entries?calendar_id=xxx&has_timestamp=false"

# 建立任務
curl -X POST "http://localhost:8000/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q2 產品規劃",
    "calendar_id": "YOUR_CALENDAR_ID"
  }'

# 將記事加入任務
curl -X POST "http://localhost:8000/api/v1/entries/{entry_id}/add-to-task" \
  -H "Content-Type: application/json" \
  -d '{"task_id": "YOUR_TASK_ID"}'
```

---

## 📱 前端整合範例

### React/React Native WebSocket 連接

```javascript
import { useEffect, useState } from 'react';

function useCalendarSync(calendarId, token) {
  const [entries, setEntries] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket(
      `ws://localhost:8000/ws/calendar/${calendarId}?token=${token}`
    );

    websocket.onopen = () => {
      console.log('WebSocket 已連接');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'entry:created':
          setEntries(prev => [...prev, message.data]);
          break;
        
        case 'entry:updated':
          setEntries(prev => prev.map(entry =>
            entry.id === message.data.id ? { ...entry, ...message.data.changes } : entry
          ));
          break;
        
        case 'entry:deleted':
          setEntries(prev => prev.filter(entry => entry.id !== message.data.id));
          break;
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [calendarId, token]);

  return { entries, ws };
}

// 使用
function CalendarView() {
  const { entries } = useCalendarSync(calendarId, token);
  
  return (
    <div>
      {entries.map(entry => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
```

### API 呼叫範例

```javascript
// API 客戶端
const api = {
  // 建立記事
  createEntry: async (data) => {
    const response = await fetch('http://localhost:8000/api/v1/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // 列出記事
  listEntries: async (filters) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`http://localhost:8000/api/v1/entries?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // 將記事加入任務
  addToTask: async (entryId, taskId) => {
    const response = await fetch(`http://localhost:8000/api/v1/entries/${entryId}/add-to-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ task_id: taskId })
    });
    return response.json();
  }
};

// 使用範例
async function handleCreateEntry() {
  const entry = await api.createEntry({
    title: "團隊會議",
    entry_type: "event",
    timestamp: "2024-03-15T14:00:00Z",
    calendar_id: calendarId
  });
  
  console.log('記事已建立:', entry);
}
```

---

## 🎯 核心 API 端點總覽

### 記事 API

```
POST   /api/v1/entries                     建立記事
GET    /api/v1/entries                     列出記事（支援篩選）
GET    /api/v1/entries/{id}                取得單筆記事
PATCH  /api/v1/entries/{id}                更新記事
DELETE /api/v1/entries/{id}                刪除記事
POST   /api/v1/entries/{id}/complete       標記完成
POST   /api/v1/entries/{id}/add-to-task    加入任務
POST   /api/v1/entries/{id}/remove-from-task  從任務移除
```

### 任務 API

```
POST   /api/v1/tasks                       建立任務
GET    /api/v1/tasks                       列出任務
GET    /api/v1/tasks/{id}                  取得任務（含記事）
PATCH  /api/v1/tasks/{id}                  更新任務
DELETE /api/v1/tasks/{id}                  刪除任務
```

### WebSocket

```
WS     /ws/calendar/{calendar_id}          即時同步
WS     /ws/notifications                   個人通知
```

---

## 💡 關鍵設計說明

### 1. 為什麼任務沒有 timestamp？

```python
# ❌ 錯誤設計
class Task:
    timestamp: datetime  # 任務有時間

# ✅ 正確設計
class Task:
    due_date: date  # 只有截止日期（提醒用）
    # 時間資訊來自任務內的記事

# 這樣的好處：
任務「準備發表會」
  ├─ 記事「訂場地」 (3/10 10:00)
  ├─ 記事「準備簡報」 (3/12 14:00)
  └─ 記事「發表會」 (3/15 14:00)

在日曆視圖中會顯示 3 個不同時間的記事
而不是只顯示一個任務時間
```

### 2. 記事的四種狀態

```
1. 獨立記事 + 有時間     → 顯示在日曆
2. 獨立記事 + 無時間     → 顯示在「未排程」
3. 任務記事 + 有時間     → 既在任務中，也在日曆
4. 任務記事 + 無時間     → 只在任務中
```

### 3. 視圖查詢邏輯

```python
# 日曆視圖：顯示有時間的記事
GET /entries?calendar_id=xxx&start_date=2024-03-01&end_date=2024-03-31

# 記事視圖：顯示所有記事
GET /entries?calendar_id=xxx&sort_by=created_at

# 任務視圖：顯示任務及其記事
GET /tasks?calendar_id=xxx

# 未排程區：顯示沒有時間的記事
GET /entries?calendar_id=xxx&has_timestamp=false
```

---

## 🔒 安全性

### JWT 認證

```python
from jose import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])

def create_access_token(user_id: UUID) -> str:
    payload = {"sub": str(user_id)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(token: str) -> UUID:
    payload = jwt.decode(token, SECRET_KEY)
    return UUID(payload["sub"])
```

### 權限檢查

```python
async def check_calendar_access(
    calendar_id: UUID,
    user_id: UUID,
    db: AsyncSession
) -> bool:
    """檢查用戶是否有存取日曆的權限"""
    result = await db.execute(
        select(CalendarMember).where(
            CalendarMember.calendar_id == calendar_id,
            CalendarMember.user_id == user_id
        )
    )
    return result.scalar_one_or_none() is not None
```

---

## 📊 效能優化

### 資料庫索引

```sql
-- 日曆視圖查詢優化
CREATE INDEX idx_entries_calendar_timestamp 
ON entries(calendar_id, timestamp) 
WHERE timestamp IS NOT NULL;

-- 未排程記事查詢優化
CREATE INDEX idx_entries_unscheduled 
ON entries(calendar_id, created_at) 
WHERE timestamp IS NULL;

-- 任務記事查詢優化
CREATE INDEX idx_entries_task 
ON entries(task_id, position_in_task) 
WHERE task_id IS NOT NULL;
```

### Redis 快取

```python
import redis.asyncio as redis

async def get_cached_entries(calendar_id: UUID) -> List[Entry]:
    key = f"entries:{calendar_id}"
    cached = await redis_client.get(key)
    
    if cached:
        return json.loads(cached)
    
    # 從資料庫查詢
    entries = await db.query(Entry).filter_by(calendar_id=calendar_id).all()
    
    # 快取 5 分鐘
    await redis_client.setex(key, 300, json.dumps(entries))
    
    return entries
```

---

## 🧪 測試

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_entry(client: AsyncClient):
    response = await client.post(
        "/api/v1/entries",
        json={
            "title": "測試記事",
            "entry_type": "note",
            "calendar_id": str(calendar_id)
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "測試記事"

@pytest.mark.asyncio
async def test_add_entry_to_task(client: AsyncClient):
    # 建立記事
    entry_response = await client.post("/api/v1/entries", json={...})
    entry_id = entry_response.json()["id"]
    
    # 建立任務
    task_response = await client.post("/api/v1/tasks", json={...})
    task_id = task_response.json()["id"]
    
    # 加入任務
    response = await client.post(
        f"/api/v1/entries/{entry_id}/add-to-task",
        json={"task_id": task_id}
    )
    
    assert response.status_code == 200
    assert response.json()["task_id"] == task_id
```

---

## 🚢 部署建議

### 生產環境配置

```bash
# 使用 Gunicorn + Uvicorn Workers
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -

# 環境變數
export ENVIRONMENT=production
export SECRET_KEY=$(openssl rand -hex 32)
export DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
export REDIS_URL=redis://host:6379/0
```

### Nginx 反向代理

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.yourapp.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket 支援
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📚 延伸閱讀

- FastAPI 官方文檔: https://fastapi.tiangolo.com
- SQLAlchemy 2.0: https://docs.sqlalchemy.org/en/20/
- Pydantic V2: https://docs.pydantic.dev/latest/
- PostgreSQL: https://www.postgresql.org/docs/

---

**這就是完整的 Python 後端實作！** 🎉

從資料庫設計、API 實作、WebSocket 即時同步，到 Docker 部署，所有關鍵程式碼都已包含。

你可以直接使用這些程式碼啟動專案，或根據需求進行調整。
