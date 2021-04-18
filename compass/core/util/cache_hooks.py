from __future__ import annotations

import functools
from typing import TYPE_CHECKING, TypedDict, TypeVar

import pydantic

from compass.core.settings import Settings

if TYPE_CHECKING:
    from collections.abc import Callable
    from collections.abc import Hashable

    T = TypeVar("T", bound=object)
    C = Callable[..., T]


def default_set(_key: tuple[str, int | Hashable], value: T, /) -> T:  # default no-op
    return value


def default_get(_key: tuple[str, int | Hashable]) -> T | None:  # default no-op
    return None


class _OptClass(TypedDict):  # avoid global scope
    disable_cache: bool
    set_cache: Callable[[tuple[str, int | Hashable], T], T]
    get_cache: Callable[[tuple[str, int | Hashable]], T | None]


_Opt: _OptClass = {"disable_cache": True, "set_cache": default_set, "get_cache": default_get}


def setup_cache_hooks(
    set_cache: Callable[[tuple[str, int | Hashable], T], T],
    get_cache: Callable[[tuple[str, int | Hashable]], T | None],
    disable_cache: bool = False,
) -> None:
    """Turn on caching and set options.

    Args:
        set_cache: Function to set value to given key
        get_cache: Function to retrieve value from a given key
        disable_cache: Local disable of cache, for usage by backends

    """
    Settings.use_cache = True
    _Opt["disable_cache"] = disable_cache
    _Opt["set_cache"] = set_cache
    _Opt["get_cache"] = get_cache


def cache_result(*, key: tuple[str, int], model_type: type | None = None) -> Callable[[C[T]], C[T]]:
    def decorating_function(user_function: C[T]) -> C[T]:
        return _cache_wrapper(user_function, key, model_type)

    return decorating_function


def _cache_wrapper(user_function: C[T], key: tuple[str, int], model_type: type | None = None) -> C[T]:
    if Settings.use_cache is False or _Opt["disable_cache"] == 0:  # No caching
        return user_function

    def wrapper(*args: Hashable, **kwargs: Hashable) -> T:
        key_ = key[0], (*args, *kwargs)[key[1]]  # second tuple item is position of key_id in function args
        result = _Opt["get_cache"](key_)  # pylint: disable=assignment-from-none  # default returns None, backends can override
        if result is not None:
            if model_type is not None:
                return pydantic.parse_obj_as(model_type, result)
            return result
        result = user_function(*args, **kwargs)
        _Opt["set_cache"](key_, result)
        return result

    return functools.update_wrapper(wrapper, user_function)
