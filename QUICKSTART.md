# 快速啟動指南

本指南將幫助你在 5 分鐘內啟動並測試 Calenote API。

## 前置需求

- Python 3.11+
- PostgreSQL 15+（或 Docker）
- Redis 7+（或 Docker）

## 方案 A：使用 Docker（推薦）

### 1. 啟動所有服務

```bash
# 啟動 PostgreSQL、Redis、backend 等所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看 backend 日誌
docker-compose logs -f backend
```

### 2. 訪問服務

- **API**: http://localhost:8000
- **API 文檔**: http://localhost:8000/api/docs
- **PgAdmin**: http://localhost:5050 (admin@calendar.com / admin)
- **Flower**: http://localhost:5555

### 3. 測試 API

```bash
# 健康檢查
curl http://localhost:8000/health

# 註冊使用者
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123",
    "password_confirm": "testpass123"
  }'
```

### 4. 停止服務

```bash
docker-compose down
```

---

## 方案 B：本地開發（無 Docker）

### 1. 創建並啟動虛擬環境

```bash
# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows
```

### 2. 安裝依賴

```bash
pip install -r requirements.txt
```

### 3. 配置環境變數

複製 `.env.example` 並修改為 `.env`：

```bash
cp .env.example .env
```

編輯 `.env` 文件，設置以下變數：

```env
# 資料庫
DATABASE_URL=postgresql+asyncpg://calendar_user:calendar_password@localhost:5432/calendar_db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# 密碼強度
MIN_PASSWORD_LENGTH=8

# CORS（根據需要調整）
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:19006"]

# 環境
ENVIRONMENT=development
DEBUG=true
```

**生成安全的 SECRET_KEY**：

```bash
# 使用 openssl
openssl rand -hex 32

# 或使用 Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. 啟動 PostgreSQL 和 Redis

#### 使用 Docker（僅資料庫）

```bash
# 只啟動 PostgreSQL 和 Redis
docker-compose up -d postgres redis

# 檢查狀態
docker-compose ps
```

#### 或手動安裝並啟動

參考：
- PostgreSQL: https://www.postgresql.org/download/
- Redis: https://redis.io/download

確保服務正在運行：

```bash
# 測試 PostgreSQL
psql -U calendar_user -d calendar_db

# 測試 Redis
redis-cli ping
```

### 5. 運行資料庫遷移

```bash
# 確保在 venv 中
source venv/bin/activate

# 運行遷移
alembic upgrade head
```

**預期輸出**：
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 43a939bb9727, Initial migration: create users, calendars, entries, and tasks tables
```

### 6. 啟動 API 服務器

```bash
# 開發模式（支持熱重載）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**預期輸出**：
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 7. 測試 API

打開新的終端窗口：

```bash
# 健康檢查
curl http://localhost:8000/health

# 或訪問 API 文檔
open http://localhost:8000/api/docs  # Mac
xdg-open http://localhost:8000/api/docs  # Linux
```

---

## 運行自動測試腳本

我們提供了一個自動測試腳本來驗證所有 API 功能：

```bash
# 確保在 venv 中且 API 正在運行
source venv/bin/activate

# 運行測試
python scripts/test_api.py
```

**預期輸出**：
```
============================================================
🚀 開始測試 API
============================================================

【步驟 1】健康檢查
✓ Health check: 200
  Response: {'status': 'healthy', 'version': '1.0.0'}

【步驟 2】認證測試

📝 測試註冊...
  Status: 201
  ✓ 註冊成功
  User ID: 550e8400-e29b-41d4-a716-446655440000
  Access Token: eyJhbGciOiJIUzI1NiIsI...

🔐 測試登入...
  ✓ 登入成功

【步驟 3】日曆操作測試

📅 測試創建日曆...
  ✓ 日曆創建成功
  Calendar ID: 660e8400-e29b-41d4-a716-446655440001

📋 測試列出日曆...
  ✓ 找到 1 個日曆

【步驟 4】記事操作測試

📝 測試創建記事...
  ✓ 記事創建成功
  Entry ID: 770e8400-e29b-41d4-a716-446655440002

📋 測試列出記事...
  ✓ 找到 1 個記事

【步驟 5】任務操作測試

✅ 測試創建任務...
  ✓ 任務創建成功
  Task ID: 880e8400-e29b-41d4-a716-446655440003

📋 測試列出任務...
  ✓ 找到 1 個任務

============================================================
✅ 所有測試通過！
============================================================

💡 下一步：
  1. 訪問 http://localhost:8000/api/docs 查看完整 API 文檔
  2. 使用 Postman 或 curl 進行更詳細的測試
  3. 測試 WebSocket 連接（參考 CLAUDE.md）
```

---

## 互動式 API 文檔

訪問以下 URL 來使用 Swagger UI 互動式測試 API：

**http://localhost:8000/api/docs**

你可以：
1. 瀏覽所有可用的 endpoints
2. 查看 request/response schemas
3. 直接在瀏覽器中測試 API
4. 生成 curl 命令

### 使用步驟

1. **註冊/登入取得 Token**
   - 展開 `POST /api/v1/auth/register` 或 `POST /api/v1/auth/login`
   - 點擊「Try it out」
   - 填寫表單
   - 點擊「Execute」
   - 複製回應中的 `access_token`

2. **設置認證**
   - 點擊頁面右上角的「Authorize」按鈕
   - 在 `HTTPBearer (http, Bearer)` 欄位輸入：`Bearer YOUR_ACCESS_TOKEN`
   - 點擊「Authorize」

3. **測試其他 Endpoints**
   - 現在你可以測試任何需要認證的 endpoint
   - 所有請求都會自動包含 Authorization header

---

## 常見問題

### Q: 資料庫連接失敗

**錯誤訊息**：
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server
```

**解決方法**：
1. 確認 PostgreSQL 正在運行：
   ```bash
   # Docker
   docker-compose ps postgres

   # 本地
   pg_isready -U calendar_user
   ```

2. 檢查 `.env` 中的 `DATABASE_URL` 是否正確

3. 確認防火牆允許 5432 端口

### Q: Redis 連接失敗

**錯誤訊息**：
```
redis.exceptions.ConnectionError: Error 111 connecting to localhost:6379
```

**解決方法**：
1. 確認 Redis 正在運行：
   ```bash
   # Docker
   docker-compose ps redis

   # 本地
   redis-cli ping
   ```

2. 檢查 `.env` 中的 `REDIS_URL` 是否正確

### Q: Alembic 遷移失敗

**錯誤訊息**：
```
alembic.util.exc.CommandError: Target database is not up to date
```

**解決方法**：
```bash
# 查看當前版本
alembic current

# 查看遷移歷史
alembic history

# 升級到最新版本
alembic upgrade head

# 如果需要重置
alembic downgrade base
alembic upgrade head
```

### Q: Token 認證失敗

**錯誤訊息**：
```json
{
  "detail": "Invalid authentication credentials"
}
```

**解決方法**：
1. 確認 token 格式正確：`Bearer eyJhbGc...`
2. 檢查 token 是否過期（預設 30 分鐘）
3. 使用 refresh token 獲取新的 access token：
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
   ```

---

## 下一步

恭喜！你已經成功啟動了 Calenote API。接下來可以：

1. **查看完整文檔**
   - [CLAUDE.md](./CLAUDE.md) - 開發指南和架構說明
   - [API_EXAMPLES.md](./API_EXAMPLES.md) - 詳細的 API 使用範例

2. **開發前端**
   - 使用 React (Next.js) 或 React Native (Expo)
   - 參考 WebSocket 範例進行即時同步

3. **創建測試**
   - 使用 pytest 創建單元測試和整合測試
   - 運行：`pytest tests/`

4. **部署到生產環境**
   - 配置 HTTPS/WSS
   - 設置環境變數
   - 使用 Gunicorn + Uvicorn workers
   - 配置 Nginx 反向代理

5. **監控和日誌**
   - 設置 Flower 監控 Celery（http://localhost:5555）
   - 配置日誌聚合服務

---

## 需要幫助？

- 查看 [CLAUDE.md](./CLAUDE.md) 了解項目架構
- 查看 [API_EXAMPLES.md](./API_EXAMPLES.md) 了解 API 使用方法
- 訪問 [http://localhost:8000/api/docs](http://localhost:8000/api/docs) 查看互動式文檔
- 查看專案文檔：
  - [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - 專案概覽
  - [three_views_detailed.md](./three_views_detailed.md) - UI/UX 設計
  - [COMPLETE_BACKEND_GUIDE.md](./COMPLETE_BACKEND_GUIDE.md) - 完整後端指南
