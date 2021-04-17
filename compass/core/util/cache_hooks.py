from __future__ import annotations

import functools
import json
from pathlib import Path
import time
from typing import Literal, TYPE_CHECKING, TypeVar

from pydantic.json import pydantic_encoder

from compass.core.settings import Settings
from compass.core.util import context_managers

if TYPE_CHECKING:
    from collections.abc import Callable
    from collections.abc import Hashable

    T = TypeVar("T", bound=object)
    RT = TypeVar("RT")  # Return Type
    C = Callable[..., RT]

_cache: dict[tuple[str, int], tuple[int, object]] = {}


class _Opt:  # avoid global scope
    BACKEND_DISK: bool = False
    EXPIRY_SECONDS: int = 60
    set_cache: Callable[[tuple[str, int], T], T] = lambda key, value: value
    get_cache: Callable[[tuple[str, int]], T | None] = lambda key: None
    clear_cache: Callable[[], None] = lambda: None


def set_val(key: tuple[str, int], value: T, /) -> T:
    if _Opt.BACKEND_DISK:
        key_type, key_id = key
        filename = Path(f"cache/{key_type}-{key_id}.json")
        with context_managers.filesystem_guard(f"Unable to write cache file to {filename}"):
            filename.write_text(json.dumps(value, ensure_ascii=False, default=pydantic_encoder), encoding="utf-8")
    else:
        _cache[key] = time.monotonic_ns() // 10 ** 9, value
    return value


def get_val(key: tuple[str, int]) -> T | None:
    if _Opt.BACKEND_DISK:
        key_type, key_id = key
        filename = Path(f"cache/{key_type}-{key_id}.json")
        if not filename.is_file():  # catching errors is expensive, so check first
            return None
        try:
            json_data: object = json.loads(filename.read_text(encoding="utf-8"))
            if json_data and time.time() - filename.stat().st_mtime < _Opt.EXPIRY_SECONDS:
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
        if time.monotonic() - time_stored < _Opt.EXPIRY_SECONDS:
            return value  # type: ignore[return-value]
        del _cache[key]
        return None


def clear() -> None:
    if _Opt.BACKEND_DISK:
        pass  # TODO clear cache/ directory
    else:
        _cache.clear()


def setup_cache(
    set_cache: Callable[[tuple[str, int], T], T],
    get_cache: Callable[[tuple[str, int]], T | None],
    clear_cache: Callable[[], None],
    backend: Literal["memory", "disk"],
    expiry: int = 0,
) -> None:
    """Turn on caching and set options.

    Args:
        set_cache: Function to set value to given key
        get_cache: Function to retrieve value from a given key
        clear_cache: Function to clear the cache
        backend: Cache to disk or in-memory
        expiry: Cache expiry in minutes. 0 to disable time-based expiry

    """
    Settings.use_cache = True
    _Opt.BACKEND_DISK = backend == "disk"
    _Opt.EXPIRY_SECONDS = expiry * 60
    _Opt.set_cache = set_cache
    _Opt.get_cache = get_cache
    _Opt.clear_cache = clear_cache


def cache_result(key) -> Callable[[C], C]:
    def decorating_function(user_function: C) -> C:
        wrapper = _cache_wrapper(user_function, key)
        return functools.update_wrapper(wrapper, user_function)
    return decorating_function


def _cache_wrapper(user_function: C, key: tuple[str, int]) -> C:
    if Settings.use_cache is False or _Opt.EXPIRY_SECONDS == 0:  # No caching
        def wrapper(*args: Hashable, **kwargs: Hashable) -> T:
            return user_function(*args, **kwargs)
    else:
        def wrapper(*args: Hashable, **kwargs: Hashable) -> T:
            result = _Opt.get_cache(key)
            if result is not None:
                return result
            result = user_function(*args, **kwargs)
            _Opt.set_cache(key, result)
            return result
    wrapper.clear_cache = _Opt.clear_cache
    return wrapper
