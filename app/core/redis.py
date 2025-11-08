"""
Redis 連接管理
"""
from redis import asyncio as aioredis
from app.config import settings

# 建立 Redis 客戶端
redis_client = aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True
)


async def get_redis():
    """
    依賴注入：取得 Redis 客戶端

    使用方式:
    ```python
    @router.get("/")
    async def endpoint(redis = Depends(get_redis)):
        await redis.set("key", "value")
        value = await redis.get("key")
    ```
    """
    return redis_client


async def ping_redis() -> bool:
    """測試 Redis 連接"""
    try:
        return await redis_client.ping()
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False


async def close_redis() -> None:
    """關閉 Redis 連接"""
    await redis_client.close()
