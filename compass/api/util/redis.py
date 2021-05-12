from __future__ import annotations

from typing import Literal, Optional, TYPE_CHECKING

from aioredis import create_redis_pool
from aioredis import Redis
import pydantic
from starlette.requests import Request

from compass.core.logger import logger

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

    from fastapi import FastAPI


class RedisSettings(pydantic.BaseSettings):
    type: Literal["redis"] = "redis"

    host: str = "localhost"
    port: int = 6380
    db: int = 0
    url: pydantic.RedisDsn = f"{type}://{host}:{port}/{db}"  # REDIS_URL takes priority if set

    password: Optional[str] = pydantic.Field(None, env={"REDIS_PASS", "REDIS_PASSWORD"})
    ssl: bool = True
    connection_timeout: int = 2
    pool_min_size: int = 1
    pool_max_size: int = 10

    class Config:
        case_sensitive = False  # this is the default, but mark for clarity.
        env_prefix = "redis_"  # env variables named `REDIS_HOST` etc


class RedisPlugin:
    def __init__(self):
        self.redis: Optional[Redis] = None

    async def setup_redis(self, app: FastAPI, config: RedisSettings = RedisSettings()) -> None:
        logger.info("Setting up Redis plugin")

        if config.type != "redis":
            raise NotImplementedError(f"Invalid Redis type '{config.type}' selected!")

        logger.debug(f"Creating connection to Redis at {config.url}")
        self.redis = await create_redis_pool(
            config.url.lower(),
            db=config.db,
            password=config.password,
            minsize=config.pool_min_size,
            maxsize=config.pool_max_size,
            timeout=config.connection_timeout,
            ssl=config.ssl,
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


async def lifetime(app: FastAPI) -> AsyncGenerator:
    logger.debug("Initialising RedisPlugin")
    redis_plugin = RedisPlugin()

    logger.debug("FastAPI startup: Redis setup")
    await redis_plugin.setup_redis(app, config=RedisSettings())
    yield
    logger.debug("FastAPI shutdown: Redis teardown")
    await redis_plugin.terminate()
