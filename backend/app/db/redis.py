import redis.asyncio as aioredis
from app.core.config import settings

redis_client: aioredis.Redis = None


async def get_redis() -> aioredis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


class RedisPublisher:
    def __init__(self):
        self.redis = None

    async def get_client(self):
        if not self.redis:
            self.redis = await get_redis()
        return self.redis

    async def publish(self, channel: str, message: str):
        client = await self.get_client()
        await client.publish(channel, message)

    async def set_match_score(self, match_id: int, score_data: str):
        client = await self.get_client()
        await client.setex(f"match:{match_id}:score", 3600, score_data)

    async def get_match_score(self, match_id: int) -> str:
        client = await self.get_client()
        return await client.get(f"match:{match_id}:score")


redis_publisher = RedisPublisher()
