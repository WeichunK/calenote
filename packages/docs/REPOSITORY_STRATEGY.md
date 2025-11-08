# Git Repository 策略建議
# Calendar + Task Management System

**結論：建議使用 Monorepo（單一倉庫）✅**

---

## 🎯 推薦方案：Monorepo

### 建議的目錄結構

```
calendar-app/                    # 單一 Git Repository
├── .git/
├── .github/
│   └── workflows/              # CI/CD for both frontend & backend
│       ├── frontend-ci.yml
│       ├── backend-ci.yml
│       └── deploy.yml
│
├── packages/                   # Frontend (Monorepo)
│   ├── shared/                # 共用程式碼
│   │   ├── src/
│   │   │   ├── types/        # 共用型別定義
│   │   │   ├── api/          # API client
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── web/                   # Next.js Web App
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── mobile/                # React Native App
│       ├── app/
│       ├── components/
│       └── package.json
│
├── backend/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── schemas/
│   │   └── api/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                      # 文件
│   ├── sdd/
│   │   ├── backend/
│   │   │   ├── 01_SPECIFY.md
│   │   │   ├── 02_PLAN.md
│   │   │   └── 03_TASKS.md
│   │   └── frontend/
│   │       ├── 01_SPECIFY_FRONTEND.md
│   │       ├── 02_PLAN_FRONTEND.md
│   │       └── 03_TASKS_FRONTEND.md
│   ├── api/                   # API 文件
│   └── architecture/
│
├── docker-compose.yml         # 本地開發環境
├── package.json              # Root package.json (workspaces)
├── .gitignore
└── README.md                 # 整體專案說明
```

---

## ✅ Monorepo 的優點

### 1. 型別安全和程式碼共享
```typescript
// ✅ 前後端可以共享型別定義
// packages/shared/src/types/entry.ts
export interface Entry {
  id: string;
  title: string;
  timestamp?: string;
  is_completed: boolean;
}

// backend/app/schemas/entry.py
# 可以參考同一個倉庫的型別定義
# 確保前後端型別一致

// packages/web/components/EntryCard.tsx
import { Entry } from '@shared/types/entry';
// 直接使用共享型別
```

### 2. 原子性提交（Atomic Commits）
```bash
# ✅ API 變更可以在同一個 commit 中完成
git commit -m "Add priority field to Entry

- Backend: Add priority to Entry model
- Backend: Update API schema
- Frontend: Update Entry type
- Frontend: Display priority in EntryCard
- Mobile: Update Entry interface
"

# 前後端永遠保持同步，不會出現版本不匹配
```

### 3. 簡化版本管理
```bash
# ✅ 單一版本號
v1.0.0 → 包含整個應用
v1.1.0 → 同時更新前後端

# ❌ 多倉庫需要協調版本
frontend v1.2.0 需要 backend v2.3.1
容易搞混
```

### 4. 統一的 CI/CD
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test Backend
        run: cd backend && pytest
  
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test Frontend
        run: cd packages/web && npm test
  
  deploy:
    needs: [backend-test, frontend-test]
    # 前後端測試都通過後才部署
```

### 5. 更容易的本地開發
```bash
# ✅ 一條命令啟動整個開發環境
docker-compose up

# 包含：
# - PostgreSQL
# - Redis
# - Backend API (FastAPI)
# - Frontend Dev Server (Next.js)
# - Mobile Dev Server (Expo)
```

### 6. 協作更簡單
```bash
# ✅ 新成員只需要 clone 一個倉庫
git clone https://github.com/yourorg/calendar-app.git
cd calendar-app
docker-compose up

# ❌ 多倉庫需要 clone 多次
git clone https://github.com/yourorg/calendar-app-backend.git
git clone https://github.com/yourorg/calendar-app-frontend.git
cd backend && ...
cd frontend && ...
```

### 7. Issue 和 PR 管理更清晰
```
✅ Monorepo:
Issue #123: "Add priority filter to entries"
PR #124: 實作涵蓋前後端的完整功能

❌ Multi-repo:
Backend Issue #45: "Add priority filter API"
Frontend Issue #78: "Use priority filter API"
需要在兩個倉庫之間來回切換
```

---

## ⚠️ Monorepo 的挑戰（及解決方案）

### 1. 倉庫大小增長
**挑戰：** 隨著時間推移，倉庫會變大

**解決方案：**
```bash
# 使用 Git LFS 處理大檔案
git lfs track "*.psd"
git lfs track "*.mp4"

# 定期清理 Git history
git gc --aggressive

# Clone 時使用 shallow clone
git clone --depth 1 <repo>
```

### 2. CI/CD 時間變長
**挑戰：** 每次 commit 都要跑前後端的測試

**解決方案：**
```yaml
# 使用 path filter 只測試變更的部分
on:
  push:
    paths:
      - 'backend/**'
      - 'packages/**'

# 或使用 Turborepo/Nx 來智能緩存
```

### 3. 權限管理
**挑戰：** 前端團隊可能不小心改到後端程式碼

**解決方案：**
```yaml
# GitHub CODEOWNERS
backend/**         @backend-team
packages/web/**    @frontend-team
packages/mobile/** @mobile-team
packages/shared/** @backend-team @frontend-team
```

### 4. 不同的技術棧（Python vs TypeScript）
**挑戰：** 一個倉庫有多種語言

**解決方案：**
```
# 清楚的目錄結構
backend/          → Python 開發者工作區
packages/         → TypeScript 開發者工作區

# 分別的 README
backend/README.md     → Python 設置說明
packages/web/README.md → Next.js 設置說明
```

---

## ❌ Multi-Repo 什麼時候合適？

在以下情況才考慮分開：

### 1. 完全獨立的團隊
```
✅ 適合 Multi-Repo:
- 前端團隊 20 人，後端團隊 30 人
- 不同的 PM、不同的發布週期
- 幾乎沒有程式碼共享需求

❌ 不適合你的情況:
- 小團隊 (2-5 人)
- 緊密協作
- 需要同步發布
```

### 2. 不同的發布頻率
```
✅ 適合 Multi-Repo:
- 前端每週發布，後端每月發布
- API 版本穩定，很少變動

❌ 不適合你的情況:
- 新專案，API 還在頻繁變動
- 前後端需要同步更新
```

### 3. 完全不同的產品
```
✅ 適合 Multi-Repo:
- 一個 API 服務多個不相關的前端
- 微服務架構，服務完全獨立

❌ 不適合你的情況:
- 前後端是一個產品的兩個部分
- 緊密耦合
```

---

## 🛠️ 實作建議：Monorepo 設置

### Step 1: 初始化倉庫

```bash
# 1. 建立倉庫
mkdir calendar-app
cd calendar-app
git init

# 2. 建立根目錄 package.json (npm workspaces)
cat > package.json <<EOF
{
  "name": "calendar-app",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:web\"",
    "dev:backend": "cd backend && uvicorn app.main:app --reload",
    "dev:web": "cd packages/web && npm run dev",
    "dev:mobile": "cd packages/mobile && npm start",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && pytest",
    "test:frontend": "npm run test --workspaces",
    "build": "npm run build --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

# 3. 建立 .gitignore
cat > .gitignore <<EOF
# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# Build outputs
.next/
dist/
build/
*.egg-info/

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Database
*.db
*.sqlite3

# Testing
.coverage
coverage/
.pytest_cache/
EOF
```

### Step 2: 設置前端 Workspace

```bash
# 1. 建立 packages 目錄
mkdir -p packages/{shared,web,mobile}

# 2. 初始化 shared package
cd packages/shared
npm init -y
# 編輯 package.json，設置 name: "@calendar-app/shared"

# 3. 初始化 web package
cd ../web
npx create-next-app@latest . --typescript --tailwind --app

# 4. 初始化 mobile package
cd ../mobile
npx create-expo-app@latest . --template tabs
```

### Step 3: 設置後端

```bash
# 1. 建立 backend 目錄
mkdir -p backend/app

# 2. 建立 Python 虛擬環境
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 安裝依賴
pip install fastapi uvicorn sqlalchemy psycopg2-binary

# 4. 建立 requirements.txt
pip freeze > requirements.txt
```

### Step 4: Docker Compose 本地開發

```yaml
# docker-compose.yml
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
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://calendar_user:calendar_password@postgres:5432/calendar_db
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./packages/web
    command: npm run dev
    volumes:
      - ./packages/web:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1

volumes:
  postgres_data:
```

### Step 5: GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db

  frontend-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test --workspaces
      
      - name: Build
        run: npm run build --workspace=packages/web

  deploy:
    needs: [backend-test, frontend-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Your deployment script
          echo "Deploying..."
```

---

## 📊 比較總結

| 特性 | Monorepo ✅ | Multi-Repo ❌ |
|------|------------|--------------|
| **型別共享** | 簡單，直接 import | 複雜，需要 npm package |
| **版本管理** | 單一版本號 | 需要協調多個版本 |
| **原子性提交** | 支援 | 需要多個 PR |
| **CI/CD** | 統一配置 | 分別配置 |
| **本地開發** | 一條命令啟動 | 需要分別啟動 |
| **新成員上手** | Clone 一次 | Clone 多次 |
| **團隊協作** | 簡單，單一 Issue | 需要跨倉庫協調 |
| **程式碼審查** | 前後端一起審查 | 分別審查 |
| **適合團隊規模** | 小到中型 (< 50 人) | 大型 (> 50 人) |
| **適合發布頻率** | 同步發布 | 獨立發布 |

---

## 🎯 最終建議

**對於你的專案，強烈建議使用 Monorepo**

理由：
1. ✅ 小團隊 (2-5 人)
2. ✅ 緊密的前後端協作
3. ✅ 需要共享型別定義
4. ✅ API 還在開發階段，會頻繁變動
5. ✅ Web + Mobile 需要共享程式碼
6. ✅ 同步發布版本
7. ✅ 簡化開發和部署流程

---

## 📚 參考資料

**成功使用 Monorepo 的大型專案：**
- Google (整個公司一個 monorepo)
- Facebook (React, React Native, Metro 都在一個倉庫)
- Microsoft (TypeScript monorepo)
- Vercel (Next.js, Turbo, SWC 都在一個倉庫)

**工具推薦：**
- [Turborepo](https://turbo.build/) - Monorepo 建置工具
- [Nx](https://nx.dev/) - Monorepo 管理工具
- [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) - 內建的 workspace 支援

---

**結論：使用 Monorepo，開始享受統一管理的好處！** 🚀
