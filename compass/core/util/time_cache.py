import time
from typing import TypeVar

T = TypeVar('T', bound=object)
_cache: dict[tuple[str, int], T] = {}


def set_key(key: tuple[str, int], value: T) -> T:
    _cache[key] = time.gmtime()[:5], value
    return value


def get_key(item: tuple[str, int]) -> T | None:
    if item in _cache:
        time_stored, value = _cache[item]
        if time.time() - time.mktime(time_stored + (0, 0, 0, 0)) < 60 * 60 * 1:
            return value
        del _cache[item]
    return None


clear = _cache.clear()
