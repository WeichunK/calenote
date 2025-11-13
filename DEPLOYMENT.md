# Zeabur 部署指南

這份文件說明如何將 Calenote 應用部署到 Zeabur 平台。

## 📋 目錄

- [部署前準備](#部署前準備)
- [使用 Zeabur Template 一鍵部署](#使用-zeabur-template-一鍵部署)
- [手動部署](#手動部署)
- [部署後配置](#部署後配置)
- [驗證部署](#驗證部署)
- [常見問題](#常見問題)

---

## 部署前準備

### 1. 確認專案狀態

```bash
# 確保所有更改已提交到 Git
git status

# 推送到 GitHub
git push origin main
```

### 2. 準備 Zeabur 帳號

- 訪問 [Zeabur](https://zeabur.com)
- 使用 GitHub 帳號登入
- 確保已授權 Zeabur 訪問您的 GitHub repo

---

## 使用 Zeabur Template 一鍵部署

### 步驟 1: 部署模板

1. 登入 Zeabur Dashboard
2. 點擊 **"Create Project"**
3. 選擇 **"Deploy from Template"** 或 **"Import from GitHub"**
4. 選擇您的 `calenote` repository
5. Zeabur 會自動讀取 `zeabur.yaml` 配置

### 步驟 2: 確認服務配置

Zeabur 將自動創建以下服務：

- ✅ **PostgreSQL 15** - 資料庫服務
- ✅ **Redis 7** - 快取和 Session 服務
- ✅ **Backend API** - FastAPI 後端
- ✅ **Frontend Web** - Next.js 前端

### 步驟 3: 等待部署完成

部署過程大約需要 3-5 分鐘：

1. PostgreSQL 和 Redis 啟動（~30 秒）
2. Backend 構建和部署（~2 分鐘）
   - 安裝 Python 依賴
   - 執行資料庫遷移 (`alembic upgrade head`)
3. Frontend 構建和部署（~2 分鐘）
   - 安裝 npm 依賴
   - 構建 Next.js 應用

---

## 手動部署

如果您不想使用模板，可以手動添加服務：

### 1. 創建 Project

```
Zeabur Dashboard → Create Project → 輸入項目名稱
```

### 2. 添加 PostgreSQL

```
Add Service → Marketplace → PostgreSQL → 選擇版本 15
```

**配置：**
- Database: `calendar_db`
- User: `calendar_user`
- Password: （自動生成）

### 3. 添加 Redis

```
Add Service → Marketplace → Redis → 選擇版本 7
```

**配置：**
- Password: （自動生成）

### 4. 添加 Backend Service

```
Add Service → Git → 選擇 calenote repo → 主分支
```

**配置：**

| 設定 | 值 |
|-----|-----|
| Service Name | backend |
| Root Directory | `/` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}` |

**環境變數：** (參考 `.env.production.example`)

```bash
DATABASE_URL=${POSTGRES_CONNECTION_STRING}
REDIS_URL=${REDIS_CONNECTION_STRING}
SECRET_KEY=<使用 openssl rand -hex 32 生成>
BACKEND_CORS_ORIGINS=["${FRONTEND_DOMAIN}"]
ENVIRONMENT=production
# ... 其他環境變數見 .env.production.example
```

**Volume 掛載：**
```
/app/uploads → Volume (用於檔案上傳)
```

### 5. 添加 Frontend Service

```
Add Service → Git → 選擇 calenote repo → 主分支
```

**配置：**

| 設定 | 值 |
|-----|-----|
| Service Name | frontend |
| Root Directory | `packages/web` |
| Build Command | `cd ../.. && npm install && npm run build --workspace=web` |
| Start Command | `cd ../.. && npm run start --workspace=web` |

**環境變數：**

```bash
NEXT_PUBLIC_API_URL=https://${BACKEND_DOMAIN}/api/v1
NEXT_PUBLIC_WS_URL=wss://${BACKEND_DOMAIN}/ws
NODE_ENV=production
```

---

## 部署後配置

### 1. 生成並設定 SECRET_KEY（⚠️ 必須執行）

Backend 的 `SECRET_KEY` 預設值是佔位符，必須更改：

```bash
# 在本地終端機執行
openssl rand -hex 32
```

複製輸出的密鑰，然後：

1. 進入 Zeabur Dashboard
2. 選擇 Backend 服務
3. 進入 "Variables" 頁籤
4. 找到 `SECRET_KEY`
5. 貼上剛才生成的密鑰
6. 點擊 "Save"
7. **重啟 Backend 服務**

### 2. 配置自訂域名（可選）

如果您想使用自己的域名：

1. 進入服務設定
2. 點擊 "Domains" 頁籤
3. 添加自訂域名
4. 按照說明配置 DNS 記錄（CNAME）
5. 等待 SSL 證書自動配置

### 3. 調整 CORS 設定（如果使用自訂域名）

如果前端使用自訂域名，需要更新 Backend 的 `BACKEND_CORS_ORIGINS`：

```bash
# Zeabur 自動填充的格式
BACKEND_CORS_ORIGINS=["${FRONTEND_DOMAIN}"]

# 使用自訂域名
BACKEND_CORS_ORIGINS=["https://app.yourdomain.com"]
```

---

## 驗證部署

### 1. 檢查服務狀態

在 Zeabur Dashboard 中：

- ✅ 所有服務顯示綠色（Running）
- ✅ 沒有紅色錯誤訊息
- ✅ Backend 和 Frontend 都有分配的域名

### 2. 測試 Backend API

訪問 Backend 的 API 文檔：

```
https://<backend-domain>/api/docs
```

應該看到 Swagger UI 介面。

### 3. 測試 Frontend

訪問 Frontend 域名：

```
https://<frontend-domain>
```

應該看到登入頁面。

### 4. 測試完整功能

使用測試帳號登入：

```
Email: demo@example.com
Password: demo123456
```

測試以下功能：

- ✅ 登入成功
- ✅ Calendar View 顯示正常
- ✅ 創建 Entry
- ✅ 編輯 Entry
- ✅ 刪除 Entry
- ✅ 創建 Task
- ✅ WebSocket 連接成功（右上角應顯示綠色連接狀態）
- ✅ 實時同步（開兩個瀏覽器分頁測試）

### 5. 檢查 WebSocket 連接

打開瀏覽器開發者工具（F12）：

1. 切換到 "Network" 頁籤
2. 過濾 "WS" (WebSocket)
3. 應該看到一個連接到 `wss://<backend-domain>/ws/calendar/...` 的 WebSocket
4. 狀態應該是 "101 Switching Protocols"（綠色）

---

## 常見問題

### Q1: Backend 啟動失敗，顯示 "SECRET_KEY" 錯誤

**原因：** SECRET_KEY 還是預設的佔位符值

**解決方法：**
1. 生成新的密鑰：`openssl rand -hex 32`
2. 在 Zeabur Dashboard 更新 SECRET_KEY 環境變數
3. 重啟 Backend 服務

### Q2: Frontend 無法連接 Backend API

**原因：** CORS 配置錯誤或 API URL 配置錯誤

**解決方法：**
1. 檢查 Frontend 的 `NEXT_PUBLIC_API_URL` 是否正確
2. 檢查 Backend 的 `BACKEND_CORS_ORIGINS` 是否包含 Frontend 域名
3. 查看 Backend logs 確認 CORS 錯誤訊息

### Q3: WebSocket 連接失敗

**原因：** WebSocket URL 配置錯誤或未使用 wss://

**解決方法：**
1. 確認 Frontend 的 `NEXT_PUBLIC_WS_URL` 使用 `wss://`（不是 `ws://`）
2. 確認 Backend 域名正確
3. 檢查瀏覽器 Console 的 WebSocket 錯誤訊息

### Q4: 資料庫遷移失敗

**原因：** DATABASE_URL 格式錯誤或無法連接資料庫

**解決方法：**
1. 檢查 `DATABASE_URL` 環境變數格式
2. 確認 PostgreSQL 服務正在運行
3. 查看 Backend logs 獲取詳細錯誤訊息
4. 手動執行遷移（如果需要）：
   ```bash
   # 在 Zeabur CLI 或 Shell 中
   alembic upgrade head
   ```

### Q5: 檔案上傳失敗

**原因：** Volume 未正確掛載

**解決方法：**
1. 確認 Backend 服務有掛載 Volume 到 `/app/uploads`
2. 檢查 `UPLOAD_DIR` 環境變數設定為 `/app/uploads`
3. 確認 Volume 有足夠的儲存空間

### Q6: 部署後性能很慢

**可能原因：**
- 免費方案的資源限制
- 資料庫連接池配置不當
- 未啟用 Redis 快取

**優化建議：**
1. 升級到付費方案增加資源
2. 調整 `DATABASE_POOL_SIZE` 和 `DATABASE_MAX_OVERFLOW`
3. 確認 Redis 服務正常運作
4. 啟用 CDN（如果使用自訂域名）

### Q7: 如何查看服務 Logs？

**查看方法：**
1. 進入 Zeabur Dashboard
2. 選擇要查看的服務
3. 點擊 "Logs" 頁籤
4. 選擇時間範圍查看

**常用 Log 位置：**
- Backend: `stderr` 和 `stdout`
- Frontend: Next.js build logs 和 runtime logs

### Q8: 如何回滾到之前的版本？

**回滾步驟：**
1. 在 Git 中回滾到之前的 commit
2. 推送到 GitHub
3. Zeabur 會自動觸發重新部署
4. 或者在 Zeabur Dashboard 選擇 "Redeploy" 並選擇特定 commit

---

## 🎯 成功部署檢查清單

- [ ] PostgreSQL 服務運行正常
- [ ] Redis 服務運行正常
- [ ] Backend API 啟動成功
- [ ] Frontend Web 啟動成功
- [ ] SECRET_KEY 已更新為安全值
- [ ] CORS 配置正確
- [ ] WebSocket 連接成功
- [ ] API 文檔可訪問 (`/api/docs`)
- [ ] 測試帳號可以登入
- [ ] Entry CRUD 功能正常
- [ ] Task 功能正常
- [ ] Calendar View 顯示正常
- [ ] 實時同步功能正常
- [ ] 檔案上傳功能正常（如果需要）

---

## 📚 相關資源

- [Zeabur 官方文檔](https://zeabur.com/docs)
- [Zeabur Discord 社群](https://discord.gg/zeabur)
- [FastAPI 部署指南](https://fastapi.tiangolo.com/deployment/)
- [Next.js 部署文檔](https://nextjs.org/docs/deployment)
- [Calenote GitHub Repository](https://github.com/WeichunK/calenote)

---

## 🆘 需要協助？

如果遇到問題：

1. 查看 [常見問題](#常見問題) 章節
2. 查看 Zeabur 服務的 Logs
3. 查看 Backend 的 API 文檔 (`/api/docs`)
4. 在 GitHub Repository 開 Issue
5. 在 Zeabur Discord 尋求協助

---

**祝部署順利！** 🚀
