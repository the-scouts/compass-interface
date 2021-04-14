from __future__ import annotations

import time
from typing import cast, TypeVar, TYPE_CHECKING

if TYPE_CHECKING:
    T = TypeVar("T", bound=object)

_cache: dict[tuple[str, int], tuple[time.struct_time, object]] = {}


def set_key(key: tuple[str, int], /, value: T) -> T:
    _cache[key] = time.gmtime(), value
    return value


def get_key(key_type: str, key_id: int, /) -> T | None:
    pair = _cache.get((key_type, key_id))
    if pair is None:
        return None
    time_stored, value = pair
    if time.time() - time.mktime(time_stored) < 60 * 60 * 1:
        return cast(T, value)  # cast here not ideal but oh well
    del _cache[key_type, key_id]
    return None


clear = _cache.clear
