from __future__ import annotations

import json
import time
from typing import Literal, TYPE_CHECKING, TypeVar

from pydantic.json import pydantic_encoder

from compass.core.settings import Settings
from compass.core.util import context_managers

if TYPE_CHECKING:
    from pathlib import Path

    T = TypeVar("T", bound=object)

_cache: dict[tuple[str, int], tuple[int, object]] = {}
clear = _cache.clear  # clear cache function


class _Opt:  # avoid global scope
    BACKEND_DISK: bool = False
    EXPIRY_SECONDS: int = 60


def set_val(value: T, /, *, filename: Path | None = None, key: tuple[str, int] | None = None) -> T:
    if Settings.use_cache is True:
        if _Opt.BACKEND_DISK:
            if filename is None:
                raise ValueError("Filename is None!")
            with context_managers.filesystem_guard(f"Unable to write cache file to {filename}"):
                filename.write_text(json.dumps(value, ensure_ascii=False, default=pydantic_encoder), encoding="utf-8")
        else:
            if key is None:
                raise ValueError("Key is None!")
            _cache[key] = time.monotonic_ns() // 10 ** 9, value
    return value


def get_val(*, filename: Path | None = None, key: tuple[str, int] | None = None) -> T | None:
    if Settings.use_cache is False:
        return None
    if _Opt.BACKEND_DISK:
        if filename is None:
            raise ValueError("Filename is None!")
        if not filename.is_file():  # catching errors is expensive, so check first
            return None
        try:
            json_data: object = json.loads(filename.read_text(encoding="utf-8"))
            if json_data and (_Opt.EXPIRY_SECONDS == 0 or time.time() - filename.stat().st_mtime < _Opt.EXPIRY_SECONDS):
                return json_data  # type: ignore[return-value]
        except FileNotFoundError:
            pass
    else:
        if key is None:
            raise ValueError("Key is None!")
        pair = _cache.get(key)
        if pair is None:
            return None
        time_stored, value = pair
        if _Opt.EXPIRY_SECONDS == 0 or time.monotonic() - time_stored < _Opt.EXPIRY_SECONDS:
            return value  # type: ignore[return-value]
        del _cache[key]
    return None


def setup_cache(backend: Literal["memory", "disk"], expiry: int = 0) -> None:
    """Turn on caching and set options.

    Args:
        backend: Cache to disk or in-memory
        expiry: Cache expiry in minutes. 0 to disable time-based expiry

    """
    Settings.use_cache = True
    _Opt.BACKEND_DISK = backend == "disk"
    _Opt.EXPIRY_SECONDS = expiry * 60
