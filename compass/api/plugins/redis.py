from typing import Optional

from aioredis import create_redis_pool
from aioredis import Redis
from fastapi import FastAPI
import pydantic
from starlette.requests import Request

REDIS_TYPE: str = "redis"


class RedisError(Exception):
    pass


class RedisSettings(pydantic.BaseSettings):
    type: str = REDIS_TYPE

    url: str = None
    host: str = "localhost"
    port: int = 6379
    password: Optional[str] = pydantic.Field(None, env="PASS")
    db: int = 0
    connection_timeout: int = 2

    pool_min_size: int = 1
    pool_max_size: int = 10

    @property
    def address(self) -> str:
        return pydantic.RedisDsn.build(scheme="redis", host=self.host, port=f"{self.port}", path=f"/{self.db}")

    class Config:
        case_sensitive = False  # this is the default, but mark for clarity.
        env_prefix = "redis_"  # env variables named `REDIS_HOST` etc


class RedisPlugin:
    def __init__(self, app: FastAPI = None, config: RedisSettings = RedisSettings()):
        self.redis: Optional[Redis] = None
        self.config = config

        if app:
            app.state.REDIS = self

    async def __call__(self) -> Redis:
        if self.redis is None:
            raise RedisError("Redis is not initialized")
        return self.redis

    async def setup(self, app: FastAPI) -> None:
        app.state.REDIS = self

    async def init(self) -> None:
        if self.redis is not None:
            return self.redis

        if self.config.type != REDIS_TYPE:
            raise NotImplementedError(f"Invalid Redis type '{self.config.type}' selected!")

        options = {
            "db": self.config.db,
            "password": self.config.password,
            "minsize": self.config.pool_min_size,
            "maxsize": self.config.pool_max_size,
            "timeout": self.config.connection_timeout,
        }
        self.redis = await create_redis_pool(self.config.address, **options)

    async def terminate(self) -> None:
        self.config = None
        if self.redis is not None:
            self.redis.close()
            await self.redis.wait_closed()
            self.redis = None


async def depends_redis(request: Request) -> Redis:
    return await request.app.state.REDIS()
