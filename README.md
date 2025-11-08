# Calendar App - Python Backend 快速開始

## 📋 技術棧

- **Python 3.11+**
- **FastAPI** - 現代、快速的 Web 框架
- **SQLAlchemy 2.0** - 異步 ORM
- **PostgreSQL 15** - 主要資料庫
- **Redis 7** - 快取與 Session
- **Celery** - 背景任務
- **WebSocket** - 即時同步

## 🚀 快速開始

### 方法 1: 使用 Docker（推薦）

```bash
# 1. 啟動所有服務
docker-compose up -d

# 2. 查看日誌
docker-compose logs -f backend

# 3. 執行資料庫遷移
docker-compose exec backend alembic upgrade head

# 4. 訪問 API 文檔
# http://localhost:8000/api/docs
```

服務端口：
- Backend API: http://localhost:8000
- PgAdmin: http://localhost:5050 (admin@calendar.com / admin)
- Flower (Celery監控): http://localhost:5555

### 方法 2: 本地開發

```bash
# 1. 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 安裝依賴
pip install -r requirements.txt

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env 檔案

# 4. 啟動 PostgreSQL 和 Redis
docker-compose up -d postgres redis

# 5. 執行資料庫遷移
alembic upgrade head

# 6. 啟動開發伺服器
uvicorn app.main:app --reload

# 7. (另一個終端) 啟動 Celery Worker
celery -A app.tasks.celery_app worker --loglevel=info
```

## 📁 專案結構

```
app/
├── main.py                 # FastAPI 應用入口
├── config.py               # 配置管理
├── api/                    # API 路由
│   ├── v1/
│   │   ├── entries.py      # 記事 API
│   │   ├── tasks.py        # 任務 API
│   │   └── calendars.py    # 日曆 API
│   └── websocket.py        # WebSocket
├── models/                 # SQLAlchemy 模型
│   ├── entry.py           # 記事模型
│   └── task.py            # 任務模型
├── schemas/               # Pydantic Schemas
├── crud/                  # CRUD 操作
├── services/              # 業務邏輯
└── core/                  # 核心功能
    ├── database.py        # 資料庫連接
    ├── security.py        # 認證安全
    └── websocket_manager.py  # WebSocket 管理
```

## 🔑 核心 API 端點

### 記事 (Entries)

```bash
# 建立記事
POST /api/v1/entries
{
  "title": "團隊會議",
  "content": "討論 Q2 規劃",
  "entry_type": "event",
  "timestamp": "2024-03-15T14:00:00Z",
  "calendar_id": "xxx"
}

# 列出記事（支援篩選）
GET /api/v1/entries?calendar_id=xxx&has_timestamp=false

# 更新記事
PATCH /api/v1/entries/{entry_id}

# 標記完成
POST /api/v1/entries/{entry_id}/complete

# 加入任務
POST /api/v1/entries/{entry_id}/add-to-task
{
  "task_id": "xxx"
}

# 從任務中移除（記事不會被刪除）
POST /api/v1/entries/{entry_id}/remove-from-task
```

### 任務 (Tasks)

```bash
# 建立任務
POST /api/v1/tasks
{
  "title": "Q2 產品規劃",
  "description": "...",
  "calendar_id": "xxx"
}

# 取得任務（含所有記事）
GET /api/v1/tasks/{task_id}

# 回應包含：
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
      "timestamp": "2024-03-10T10:00:00Z",
      "is_completed": true
    },
    ...
  ]
}
```

## 🔌 WebSocket 連接

```javascript
// 前端連接範例
const token = "your-jwt-token";
const calendarId = "calendar-uuid";

const ws = new WebSocket(
  `ws://localhost:8000/ws/calendar/${calendarId}?token=${token}`
);

ws.onopen = () => {
  console.log('WebSocket 已連接');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'entry:created':
      // 新記事被建立
      console.log('新記事:', message.data);
      break;
    
    case 'entry:updated':
      // 記事被更新
      console.log('記事更新:', message.data);
      break;
    
    case 'entry:completed':
      // 記事被標記完成
      console.log('記事完成:', message.data);
      break;
    
    case 'task:updated':
      // 任務被更新
      console.log('任務更新:', message.data);
      break;
  }
};

// 發送心跳
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

## 🗃️ 資料庫遷移

```bash
# 建立新的遷移
alembic revision --autogenerate -m "Add new field"

# 執行遷移
alembic upgrade head

# 回滾一個版本
alembic downgrade -1

# 查看遷移歷史
alembic history
```

## 🧪 測試

```bash
# 執行所有測試
pytest

# 執行特定測試
pytest tests/test_entries.py

# 生成覆蓋率報告
pytest --cov=app --cov-report=html
```

## 📊 監控

### Flower (Celery 監控)
訪問 http://localhost:5555 查看：
- 背景任務狀態
- Worker 狀態
- 任務執行歷史

### API 文檔
訪問 http://localhost:8000/api/docs 查看：
- 自動生成的 OpenAPI 文檔
- 可直接測試 API

## 🔒 認證流程

```bash
# 1. 註冊
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "username": "user",
  "password": "password123"
}

# 2. 登入
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# 回應：
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}

# 3. 使用 token 訪問受保護的端點
# Header: Authorization: Bearer eyJ...
```

## 🚀 部署

### 生產環境建議

```bash
# 1. 設定生產環境變數
export ENVIRONMENT=production
export SECRET_KEY=$(openssl rand -hex 32)
export DATABASE_URL=postgresql+asyncpg://...

# 2. 使用 Gunicorn 部署
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000

# 3. 使用 systemd 管理服務
sudo systemctl start calendar-backend
```

## 🐛 常見問題

### Q: WebSocket 連接失敗？
A: 確認：
1. Token 是否有效
2. 用戶是否有日曆存取權限
3. 防火牆是否允許 WebSocket 連接

### Q: 資料庫連接錯誤？
A: 檢查：
1. PostgreSQL 是否正在運行
2. DATABASE_URL 是否正確
3. 資料庫是否已建立

### Q: 記事無法加入任務？
A: 確認：
1. 任務和記事是否屬於同一個日曆
2. 用戶是否有編輯權限

## 📚 更多資源

- FastAPI 文檔: https://fastapi.tiangolo.com
- SQLAlchemy 文檔: https://docs.sqlalchemy.org
- Celery 文檔: https://docs.celeryq.dev

## 💡 開發提示

1. **使用類型提示**：充分利用 Python 的類型提示，IDE 會提供更好的支援
2. **異步優先**：使用 async/await 處理 I/O 操作
3. **日誌記錄**：使用 loguru 記錄重要操作
4. **錯誤處理**：使用 FastAPI 的 HTTPException
5. **測試驅動**：先寫測試，再寫功能
