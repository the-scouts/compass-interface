from __future__ import annotations

import json
from pathlib import Path
import time
from typing import Literal, TYPE_CHECKING, TypeVar

from pydantic.json import pydantic_encoder

from compass.core.util import context_managers
from compass.core.util.cache_hooks import setup_cache_hooks

if TYPE_CHECKING:
    T = TypeVar("T", bound=object)

_cache: dict[tuple[str, int], tuple[int, object]] = {}


class _BackendOpt:
    BACKEND_DISK: bool
    EXPIRY_SECONDS: int


def _set_val(key: tuple[str, int], value: T, /) -> T:
    if _BackendOpt.BACKEND_DISK:
        key_type, key_id = key
        filename = Path(f"cache/{key_type}-{key_id}.json")
        with context_managers.filesystem_guard(f"Unable to write cache file to {filename}"):
            filename.write_text(json.dumps(value, ensure_ascii=False, default=pydantic_encoder), encoding="utf-8")
    else:
        _cache[key] = time.monotonic_ns() // 10 ** 9, value
    return value


def _get_val(key: tuple[str, int]) -> T | None:
    if _BackendOpt.BACKEND_DISK:
        key_type, key_id = key
        filename = Path(f"cache/{key_type}-{key_id}.json")
        if not filename.is_file():  # catching errors is expensive, so check first
            return None
        try:
            json_data: object = json.loads(filename.read_text(encoding="utf-8"))
            if json_data and time.time() - filename.stat().st_mtime < _BackendOpt.EXPIRY_SECONDS:
                return json_data  # type: ignore[return-value]
        except FileNotFoundError:
            return None
    else:
        if key is None:
            raise ValueError("Key is None!")
        pair = _cache.get(key)
        if pair is None:
            return None
        time_stored, value = pair
        if time.monotonic() - time_stored < _BackendOpt.EXPIRY_SECONDS:
            return value  # type: ignore[return-value]
        del _cache[key]
        return None


def setup_cache(backend: Literal["memory", "disk"], expiry: int = 0):
    """Turn on caching and set options.

    Args:
        backend: Cache to disk or in-memory
        expiry: Cache expiry in minutes. 0 to disable time-based expiry

    """
    setup_cache_hooks(_set_val, _get_val, expiry == 0)
    _BackendOpt.BACKEND_DISK = backend == "disk"
    _BackendOpt.EXPIRY_SECONDS = expiry * 60


def clear() -> None:
    if _BackendOpt.BACKEND_DISK:
        pass  # TODO clear cache/ directory
    else:
        _cache.clear()
