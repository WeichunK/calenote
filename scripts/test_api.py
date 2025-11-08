#!/usr/bin/env python3
"""
API 測試腳本
用於驗證 API 可以正常啟動並響應請求
"""
import asyncio
import httpx
from datetime import datetime


BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"


async def test_health_check():
    """測試健康檢查端點"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print(f"✓ Health check: {response.status_code}")
        print(f"  Response: {response.json()}")
        return response.status_code == 200


async def test_register_and_login():
    """測試註冊和登入流程"""
    async with httpx.AsyncClient() as client:
        # 註冊
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        register_data = {
            "email": f"test{timestamp}@example.com",
            "username": f"testuser{timestamp}",
            "password": "testpass123",
            "password_confirm": "testpass123"
        }

        print("\n📝 測試註冊...")
        response = await client.post(f"{API_V1}/auth/register", json=register_data)
        print(f"  Status: {response.status_code}")

        if response.status_code == 201:
            data = response.json()
            print(f"  ✓ 註冊成功")
            print(f"  User ID: {data['user']['id']}")
            print(f"  Access Token: {data['access_token'][:20]}...")

            # 測試登入
            print("\n🔐 測試登入...")
            login_data = {
                "email": register_data["email"],
                "password": register_data["password"]
            }
            response = await client.post(f"{API_V1}/auth/login", json=login_data)

            if response.status_code == 200:
                print(f"  ✓ 登入成功")
                return response.json()["access_token"]
            else:
                print(f"  ✗ 登入失敗: {response.text}")
                return None
        else:
            print(f"  ✗ 註冊失敗: {response.text}")
            return None


async def test_calendar_operations(token: str):
    """測試日曆操作"""
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient() as client:
        # 創建日曆
        print("\n📅 測試創建日曆...")
        calendar_data = {
            "name": "我的測試日曆",
            "description": "這是一個測試日曆",
            "color": "#3B82F6"
        }
        response = await client.post(
            f"{API_V1}/calendars/",
            json=calendar_data,
            headers=headers
        )

        if response.status_code == 201:
            calendar = response.json()
            print(f"  ✓ 日曆創建成功")
            print(f"  Calendar ID: {calendar['id']}")

            # 列出日曆
            print("\n📋 測試列出日曆...")
            response = await client.get(f"{API_V1}/calendars/", headers=headers)
            if response.status_code == 200:
                calendars = response.json()
                print(f"  ✓ 找到 {calendars['total']} 個日曆")
                return calendar["id"]

        return None


async def test_entry_operations(token: str, calendar_id: str):
    """測試記事操作"""
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient() as client:
        # 創建記事
        print("\n📝 測試創建記事...")
        entry_data = {
            "calendar_id": calendar_id,
            "title": "測試記事",
            "content": "這是一個測試記事內容",
            "timestamp": datetime.now().isoformat(),
            "priority": 2
        }
        response = await client.post(
            f"{API_V1}/entries/",
            json=entry_data,
            headers=headers
        )

        if response.status_code == 201:
            entry = response.json()
            print(f"  ✓ 記事創建成功")
            print(f"  Entry ID: {entry['id']}")

            # 取得記事列表
            print("\n📋 測試列出記事...")
            response = await client.get(
                f"{API_V1}/entries/?calendar_id={calendar_id}",
                headers=headers
            )
            if response.status_code == 200:
                entries = response.json()
                if isinstance(entries, list):
                    total = len(entries)
                else:
                    total = entries.get('total', 0)
                print(f"  ✓ 找到 {total} 個記事")
                return entry["id"]

        return None


async def test_task_operations(token: str, calendar_id: str):
    """測試任務操作"""
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient() as client:
        # 創建任務
        print("\n✅ 測試創建任務...")
        task_data = {
            "calendar_id": calendar_id,
            "title": "測試任務",
            "description": "這是一個測試任務",
            "color": "#10B981"
        }
        response = await client.post(
            f"{API_V1}/tasks/",
            json=task_data,
            headers=headers
        )

        if response.status_code == 201:
            task = response.json()
            print(f"  ✓ 任務創建成功")
            print(f"  Task ID: {task['id']}")

            # 列出任務
            print("\n📋 測試列出任務...")
            response = await client.get(
                f"{API_V1}/tasks/?calendar_id={calendar_id}",
                headers=headers
            )
            if response.status_code == 200:
                tasks = response.json()
                if isinstance(tasks, list):
                    total = len(tasks)
                else:
                    total = tasks.get('total', 0)
                print(f"  ✓ 找到 {total} 個任務")
                return task["id"]

        return None


async def main():
    """主測試流程"""
    print("=" * 60)
    print("🚀 開始測試 API")
    print("=" * 60)

    try:
        # 1. 健康檢查
        print("\n【步驟 1】健康檢查")
        if not await test_health_check():
            print("❌ API 無法連接，請確認服務已啟動")
            return

        # 2. 註冊和登入
        print("\n【步驟 2】認證測試")
        token = await test_register_and_login()
        if not token:
            print("❌ 認證測試失敗")
            return

        # 3. 日曆操作
        print("\n【步驟 3】日曆操作測試")
        calendar_id = await test_calendar_operations(token)
        if not calendar_id:
            print("❌ 日曆操作測試失敗")
            return

        # 4. 記事操作
        print("\n【步驟 4】記事操作測試")
        entry_id = await test_entry_operations(token, calendar_id)
        if not entry_id:
            print("❌ 記事操作測試失敗")
            return

        # 5. 任務操作
        print("\n【步驟 5】任務操作測試")
        task_id = await test_task_operations(token, calendar_id)
        if not task_id:
            print("❌ 任務操作測試失敗")
            return

        print("\n" + "=" * 60)
        print("✅ 所有測試通過！")
        print("=" * 60)
        print("\n💡 下一步：")
        print("  1. 訪問 http://localhost:8000/api/docs 查看完整 API 文檔")
        print("  2. 使用 Postman 或 curl 進行更詳細的測試")
        print("  3. 測試 WebSocket 連接（參考 CLAUDE.md）")

    except httpx.ConnectError:
        print("\n❌ 無法連接到 API 服務器")
        print("請確認：")
        print("  1. API 服務器正在運行（uvicorn app.main:app --reload）")
        print("  2. 資料庫已啟動並運行遷移（alembic upgrade head）")
        print("  3. PORT 8000 未被佔用")

    except Exception as e:
        print(f"\n❌ 測試過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
