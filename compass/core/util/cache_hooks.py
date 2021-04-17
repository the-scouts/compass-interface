from __future__ import annotations

import contextlib
import json
from pathlib import Path
import time
from typing import cast, Iterator, Optional, TypeVar

from compass.core.settings import Settings
from compass.core.util.context_managers import AnyCollection

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


@contextlib.contextmanager
def get_cached_json(filename: Path, /, *, expected_type: Optional[type[AnyCollection]] = None) -> Iterator[Optional[AnyCollection]]:
    if Settings.cache_to_file is False:
        yield None
        return  # don't process the rest of this context manager
    try:
        # Attempt to see if the data has been fetched already and is on the local system
        json_data = json.loads(filename.read_text(encoding="UTF8"))
        if json_data:
            if expected_type is not None:
                if isinstance(json_data, expected_type):
                    yield json_data
                else:
                    yield None
            else:
                yield json_data
    except FileNotFoundError:
        # Otherwise run the function
        yield None

        # TODO automatic result caching
        # # Try and write to a file for caching
        # with filesystem_guard("Unable to write cache file"):
        #     filename.write_text(json.dumps(x, ensure_ascii=False, indent=0, default=pydantic_encoder), encoding="utf-8")