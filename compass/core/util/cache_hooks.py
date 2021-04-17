from __future__ import annotations

import json
import time
from typing import cast, TypeVar, TYPE_CHECKING

from pydantic.json import pydantic_encoder

from compass.core.settings import Settings
from compass.core.util import context_managers

if TYPE_CHECKING:
    from pathlib import Path

T = TypeVar("T", bound=object)
_cache: dict[tuple[str, int], tuple[time.struct_time, object]] = {}


def mem_set(key: tuple[str, int], /, value: T) -> T:
    _cache[key] = time.gmtime(), value
    return value


def mem_get(key_type: str, key_id: int, /) -> T | None:
    pair = _cache.get((key_type, key_id))
    if pair is None:
        return None
    time_stored, value = pair
    if time.time() - time.mktime(time_stored) < 60 * 60 * 1:
        return cast(T, value)  # cast here not ideal but oh well
    del _cache[key_type, key_id]
    return None


clear = _cache.clear


def file_get(filename: Path, /) -> object | None:
    if Settings.cache_to_file is False:
        return None
    try:
        json_data: object = json.loads(filename.read_text(encoding="utf-8"))
        if json_data:
            return json_data
        return None
    except FileNotFoundError:
        return None


def file_set(filename: Path, value: T, /) -> None:
    if Settings.cache_to_file is False:
        return
    with context_managers.filesystem_guard(f"Unable to write cache file to {filename}"):
        filename.write_text(json.dumps(value, ensure_ascii=False, default=pydantic_encoder), encoding="utf-8")
