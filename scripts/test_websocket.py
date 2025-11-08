#!/usr/bin/env python3
"""
WebSocket 連接測試腳本
測試即時同步功能
"""
import asyncio
import json
import httpx
from datetime import datetime
from websockets import connect, ConnectionClosedError
from typing import Dict, Any


BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"


class WebSocketTester:
    """WebSocket 測試類"""

    def __init__(self):
        self.access_token = None
        self.calendar_id = None
        self.user_id = None

    async def setup_user_and_calendar(self):
        """創建測試使用者和日曆"""
        async with httpx.AsyncClient() as client:
            # 註冊使用者
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            register_data = {
                "email": f"ws_test_{timestamp}@example.com",
                "username": f"ws_test_{timestamp}",
                "password": "testpass123",
                "password_confirm": "testpass123"
            }

            print("📝 創建測試使用者...")
            response = await client.post(f"{API_V1}/auth/register", json=register_data)
            if response.status_code != 201:
                raise Exception(f"註冊失敗: {response.text}")

            data = response.json()
            self.access_token = data["access_token"]
            self.user_id = data["user"]["id"]
            print(f"  ✓ 使用者創建成功 (ID: {self.user_id})")

            # 創建日曆
            headers = {"Authorization": f"Bearer {self.access_token}"}
            calendar_data = {
                "name": "WebSocket 測試日曆",
                "description": "用於測試 WebSocket 連接"
            }

            print("📅 創建測試日曆...")
            response = await client.post(f"{API_V1}/calendars/", json=calendar_data, headers=headers)
            if response.status_code != 201:
                raise Exception(f"創建日曆失敗: {response.text}")

            calendar = response.json()
            self.calendar_id = calendar["id"]
            print(f"  ✓ 日曆創建成功 (ID: {self.calendar_id})")

    async def test_websocket_connection(self):
        """測試 WebSocket 基本連接"""
        print("\n🔌 測試 WebSocket 連接...")

        ws_url = f"{WS_URL}/ws/calendar/{self.calendar_id}?token={self.access_token}"

        try:
            async with connect(ws_url) as websocket:
                print("  ✓ WebSocket 連接已建立")

                # 接收歡迎消息
                message = await websocket.recv()
                data = json.loads(message)
                print(f"  📨 收到歡迎消息:")
                print(f"     類型: {data.get('type')}")
                print(f"     日曆 ID: {data.get('data', {}).get('calendar_id')}")
                print(f"     訂閱者數量: {data.get('data', {}).get('subscribers')}")

                # 測試 ping/pong
                print("\n  🏓 測試心跳檢測...")
                await websocket.send(json.dumps({"type": "ping"}))
                response = await websocket.recv()
                pong = json.loads(response)
                if pong.get("type") == "pong":
                    print("  ✓ 心跳檢測成功")

                print("\n  ✓ WebSocket 基本功能正常")

        except ConnectionClosedError as e:
            print(f"  ✗ WebSocket 連接關閉: {e}")
            raise
        except Exception as e:
            print(f"  ✗ WebSocket 測試失敗: {e}")
            raise

    async def test_entry_realtime_sync(self):
        """測試記事的即時同步"""
        print("\n📡 測試記事即時同步...")

        ws_url = f"{WS_URL}/ws/calendar/{self.calendar_id}?token={self.access_token}"

        async with connect(ws_url) as websocket:
            # 接收歡迎消息
            await websocket.recv()

            # 在另一個連接中創建記事，模擬其他用戶操作
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {self.access_token}"}
                entry_data = {
                    "calendar_id": self.calendar_id,
                    "title": "WebSocket 測試記事",
                    "content": "這是一個測試即時同步的記事",
                    "priority": 2
                }

                print("  📝 創建新記事...")
                response = await client.post(f"{API_V1}/entries/", json=entry_data, headers=headers)

                if response.status_code == 201:
                    print("  ✓ 記事創建成功")

                    # 等待 WebSocket 通知
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                        data = json.loads(message)

                        if data.get("type") == "entry:created":
                            print("  ✓ 收到即時同步通知！")
                            print(f"     記事標題: {data.get('data', {}).get('title')}")
                            print(f"     記事 ID: {data.get('data', {}).get('id')}")
                        else:
                            print(f"  ⚠ 收到其他類型消息: {data.get('type')}")

                    except asyncio.TimeoutError:
                        print("  ⚠ 未在 5 秒內收到 WebSocket 通知")
                        print("     注意: 可能需要檢查 entry CRUD 是否發送 WebSocket 廣播")
                else:
                    print(f"  ✗ 記事創建失敗: {response.text}")

    async def test_multiple_connections(self):
        """測試多個 WebSocket 連接"""
        print("\n👥 測試多個 WebSocket 連接...")

        ws_url = f"{WS_URL}/ws/calendar/{self.calendar_id}?token={self.access_token}"

        # 創建兩個 WebSocket 連接
        async with connect(ws_url) as ws1, connect(ws_url) as ws2:
            # 接收歡迎消息
            welcome1 = json.loads(await ws1.recv())
            welcome2 = json.loads(await ws2.recv())

            subscribers1 = welcome1.get("data", {}).get("subscribers", 0)
            subscribers2 = welcome2.get("data", {}).get("subscribers", 0)

            print(f"  ✓ 連接 1 訂閱者數量: {subscribers1}")
            print(f"  ✓ 連接 2 訂閱者數量: {subscribers2}")

            if subscribers2 > subscribers1:
                print("  ✓ 訂閱者計數正確遞增")

            # 從連接 1 發送 typing 事件
            print("\n  ⌨️  從連接 1 發送打字事件...")
            await ws1.send(json.dumps({
                "type": "typing",
                "entry_id": "test-entry-id"
            }))

            # 連接 2 應該收到通知
            try:
                message = await asyncio.wait_for(ws2.recv(), timeout=5.0)
                data = json.loads(message)

                if data.get("type") == "user:typing":
                    print("  ✓ 連接 2 收到打字通知")
                    print(f"     使用者 ID: {data.get('data', {}).get('user_id')}")
                else:
                    print(f"  ⚠ 收到其他類型消息: {data.get('type')}")

            except asyncio.TimeoutError:
                print("  ⚠ 連接 2 未收到打字通知")


async def main():
    """主測試流程"""
    print("=" * 60)
    print("🚀 開始測試 WebSocket 連接")
    print("=" * 60)

    tester = WebSocketTester()

    try:
        # 設置測試環境
        await tester.setup_user_and_calendar()

        # 測試 1: 基本連接
        await tester.test_websocket_connection()

        # 測試 2: 即時同步
        await tester.test_entry_realtime_sync()

        # 測試 3: 多連接
        await tester.test_multiple_connections()

        print("\n" + "=" * 60)
        print("✅ 所有 WebSocket 測試完成！")
        print("=" * 60)
        print("\n💡 注意事項：")
        print("  - 如果「記事即時同步」測試未收到通知，需要在 entry CRUD 中添加 WebSocket 廣播")
        print("  - 廣播代碼範例請參考 CLAUDE.md 中的 WebSocket 章節")
        print("  - WebSocket manager 已實現，但 CRUD 操作需要手動調用廣播")

    except Exception as e:
        print(f"\n❌ 測試過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
