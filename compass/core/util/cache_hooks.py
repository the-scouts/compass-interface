from __future__ import annotations

import functools
from typing import Literal, TYPE_CHECKING, TypeVar

import pydantic

from compass.core.settings import Settings

if TYPE_CHECKING:
    from collections.abc import Callable
    from collections.abc import Hashable

    T = TypeVar("T", bound=object)
    RT = TypeVar("RT")  # Return Type
    C = Callable[..., RT]


class _Opt:  # avoid global scope
    BACKEND_DISK: bool = False
    EXPIRY_SECONDS: int = 60
    set_cache: Callable[[tuple[str, int], T], T] = lambda key, value: value  # default no-op
    get_cache: Callable[[tuple[str, int]], T | None] = lambda key: None  # default no-op
    clear_cache: Callable[[], None] = lambda: None  # default no-op


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


def cache_result(*, key, model_type: type[RT] | None = None) -> Callable[[C], C]:
    def decorating_function(user_function: C) -> C:
        wrapper = _cache_wrapper(user_function, key, model_type)
        return functools.update_wrapper(wrapper, user_function)
    return decorating_function


def _cache_wrapper(user_function: C, key: tuple[str, int], model_type: type[RT] | None = None) -> C:
    if False and Settings.use_cache is False or _Opt.EXPIRY_SECONDS == 0:  # No caching
        return user_function
    else:
        def wrapper(*args: Hashable, **kwargs: Hashable) -> T:
            key_ = key[0], (*args, *kwargs)[key[1]]  # second arg is position of arg
            result = _Opt.get_cache(key_)
            if result is not None:
                if model_type is not None:
                    return pydantic.parse_obj_as(model_type, result)
                return result
            result = user_function(*args, **kwargs)
            _Opt.set_cache(key_, result)
            return result
    wrapper.clear_cache = _Opt.clear_cache
    return wrapper
