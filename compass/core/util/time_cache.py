from __future__ import annotations

import time
from typing import TypeVar, TYPE_CHECKING

if TYPE_CHECKING:
    T = TypeVar("T", bound=object)

_cache: dict[tuple[str, int], T] = {}


def set_key(key: tuple[str, int], /, value: T) -> T:
    _cache[key] = time.gmtime(), value
    return value


def get_key(key_type: str, key_id: int, /) -> T | None:
    pair = _cache.get((key_type, key_id))
    if pair is None:
        return None
    time_stored, value = pair
    if time.time() - time.mktime(time_stored + (0, 0, 0, 0)) < 60 * 60 * 1:
        return value
    del _cache[key_type, key_id]


clear = _cache.clear()
