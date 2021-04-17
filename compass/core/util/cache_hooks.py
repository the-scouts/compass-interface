from __future__ import annotations

import json
import time
from typing import cast, Literal, TypeVar, TYPE_CHECKING

from pydantic.json import pydantic_encoder

from compass.core.settings import Settings
from compass.core.util import context_managers

if TYPE_CHECKING:
    from pathlib import Path

T = TypeVar("T", bound=object)
_cache: dict[tuple[str, int], tuple[time.struct_time, object]] = {}
_BACKEND_DISK: bool = False
_EXPIRY_MINUTES: int = 60


def set(value: T, /, *, filename: Path | None = None, key: tuple[str, int] | None = None) -> T:
    if Settings.use_cache is True:
        if _BACKEND_DISK:
            if filename is None:
                raise ValueError("Filename is None!")
            with context_managers.filesystem_guard(f"Unable to write cache file to {filename}"):
                filename.write_text(json.dumps(value, ensure_ascii=False, default=pydantic_encoder), encoding="utf-8")
        else:
            if key is None:
                raise ValueError("Key is None!")
            _cache[key] = time.gmtime(), value
    return value


def get(*, filename: Path | None = None, key: tuple[str, int] | None = None) -> T | None:
    if Settings.use_cache is False:
        return None
    if _BACKEND_DISK:
        if filename is None:
            raise ValueError("Filename is None!")
        if not filename.is_file():  # catching errors is expensive, so check first
            return None
        try:
            json_data: object = json.loads(filename.read_text(encoding="utf-8"))
            if json_data:
                return json_data  # type: ignore[return-value]
            return None
        except FileNotFoundError:
            return None
    else:
        if key is None:
            raise ValueError("Key is None!")
        pair = _cache.get(key)
        if pair is None:
            return None
        time_stored, value = pair
        if time.time() - time.mktime(time_stored) < 60 * 60 * 1:
            return value  # type: ignore[return-value]
        del _cache[key]
        return None


clear = _cache.clear


def setup_cache(backend: Literal["memory", "disk"], expiry: int = 0) -> None:
    """Turn on caching and set options

    Args:
        backend: Cache to disk or in-memory
        expiry: Cache expiry in minutes. 0 to disable time-based expiry

    """
    global _BACKEND_DISK, _EXPIRY_MINUTES
    Settings.use_cache = True
    _BACKEND_DISK = backend == "disk"
    _EXPIRY_MINUTES = expiry
