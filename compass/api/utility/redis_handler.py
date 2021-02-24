from compass.api.plugins import redis


class RedisConfig(redis.RedisSettings):
    pass


redis_plugin = redis.RedisPlugin(config=RedisConfig())


async def on_startup(app) -> None:
    await redis_plugin.setup(app)
    await redis_plugin.init()


async def on_shutdown() -> None:
    await redis_plugin.terminate()
    print("Redis connection terminated")
