from __future__ import annotations

import json
import time
from typing import Any, cast, Optional, TypeVar, TYPE_CHECKING

from compass.core.settings import Settings
from compass.core.util import context_managers

if TYPE_CHECKING:
    from collections.abc import Collection
    from pathlib import Path

T = TypeVar("T", bound=object)
AnyCollection = TypeVar("AnyCollection", bound=Collection[Any])
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


def get_cached_json(filename: Path, /, *, expected_type: type[Collection[Any]] = Collection) -> Optional[Collection[Any]]:
    if Settings.cache_to_file is False:
        return None
    try:
        json_data = json.loads(filename.read_text(encoding="UTF8"))
        if not json_data:
            return None
        if expected_type is None or isinstance(json_data, expected_type):
            return json_data
        return None
    except FileNotFoundError:
        return None


def set_cached_json(filename: Path, json_string: str, /) -> None:
    if Settings.cache_to_file is False:
        return
    with context_managers.filesystem_guard(f"Unable to write cache file to {filename}"):
        filename.write_text(json_string, encoding="utf-8")
