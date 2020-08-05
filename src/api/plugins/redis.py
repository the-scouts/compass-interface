from typing import Optional, Any

from aioredis import Redis, create_redis_pool
from fastapi import FastAPI
from pydantic import BaseSettings
from starlette.requests import Request

REDIS_TYPE: str = "redis"


class RedisError(Exception):
    pass


class RedisSettings(BaseSettings):
    redis_type: str = REDIS_TYPE

    redis_url: str = None
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = None
    redis_db: int = 0
    redis_connection_timeout: int = 2

    redis_pool_min_size: int = 1
    redis_pool_max_size: int = 10

    def get_redis_address(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    class Config:
        env_prefix = ""
        use_enum_values = True


class RedisPlugin:
    def __init__(self, app: FastAPI = None, config: BaseSettings = None):
        self.redis: Optional[Redis] = None
        self.config = config or RedisSettings()

        if self.config is None:
            raise RedisError("Redis configuration is not initialized")
        elif not isinstance(self.config, RedisSettings):
            raise RedisError("Redis configuration is invalid")

        if app:
            app.state.REDIS = self

    async def __call__(self) -> Any:
        if self.redis is None:
            raise RedisError("Redis is not initialized")
        return self.redis

    async def setup(self, app: FastAPI):
        app.state.REDIS = self

    async def init(self):
        if self.redis is not None:
            return self.redis

        if self.config.redis_type != REDIS_TYPE:
            raise NotImplementedError(f"Invalid Redis type '{self.config.redis_type}' selected!")

        address = self.config.get_redis_address()
        if not address:
            raise ValueError("Redis address is blank")

        options = {
            "db": self.config.redis_db,
            "password": self.config.redis_password,
            "minsize": self.config.redis_pool_min_size,
            "maxsize": self.config.redis_pool_max_size,
            "timeout": self.config.redis_connection_timeout,
        }

        self.redis = await create_redis_pool(address, **options)

    async def terminate(self):
        self.config = None
        if self.redis is not None:
            self.redis.close()
            await self.redis.wait_closed()
            self.redis = None


async def depends_redis(request: Request) -> Redis:
    return await request.app.state.REDIS()
