from typing import Literal, Optional

from aioredis import create_redis_pool
from aioredis import Redis
from fastapi import FastAPI
import pydantic
from starlette.requests import Request

from compass.core.logger import logger


class RedisError(Exception):
    pass


class RedisSettings(pydantic.BaseSettings):
    type: Literal["redis"] = "redis"

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
    def __init__(self, config: RedisSettings = RedisSettings()):
        self.redis: Optional[Redis] = None
        self.config = config

    async def setup_redis(self, app: FastAPI) -> None:
        logger.info("Setting up Redis plugin")

        if self.redis is not None:
            app.state.redis = self.redis
            return self.redis

        if self.config.type != "redis":
            raise NotImplementedError(f"Invalid Redis type '{self.config.type}' selected!")

        logger.debug(f"Creating connection to Redis at {self.config.address}")
        self.redis = await create_redis_pool(
            self.config.address,
            db=self.config.db,
            password=self.config.password,
            minsize=self.config.pool_min_size,
            maxsize=self.config.pool_max_size,
            timeout=self.config.connection_timeout,
        )

        logger.debug("Storing redis object in FastAPI app state")
        app.state.redis = self.redis

    async def terminate(self) -> None:
        logger.info("Shutting down Redis plugin")
        if not self.redis:
            return

        # gracefully close connection
        logger.debug("Closing Redis connection")
        self.redis.close()
        await self.redis.wait_closed()
        logger.debug("Closed Redis connection")

        # remove class attributes
        del self.redis
        del self.config


redis_plugin = RedisPlugin(config=RedisSettings())


async def on_startup() -> None:
    # Import here to avoid circular imports
    from compass.api.app import app

    logger.debug("FastAPI startup: Redis setup")
    await redis_plugin.setup_redis(app)


async def on_shutdown() -> None:
    logger.debug("FastAPI shutdown: Redis teardown")
    await redis_plugin.terminate()


async def depends_redis(request: Request) -> Redis:
    redis = await request.app.state.redis
    if redis is None:
        raise RedisError("Redis is not initialized")
    return redis
