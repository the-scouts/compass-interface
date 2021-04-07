from __future__ import annotations

import contextlib
import json
from typing import TYPE_CHECKING

import pydantic

from compass.core.logger import logger
from compass.core.settings import Settings

if TYPE_CHECKING:
    from collections.abc import Iterator
    from pathlib import Path


@contextlib.contextmanager
def filesystem_guard(msg: str) -> Iterator[None]:
    try:
        yield
    except IOError as err:
        logger.error(f"{msg}: {err.errno} - {err.strerror}")


@contextlib.contextmanager
def validation_errors_logging(id_value: int, name: str = "Member No") -> Iterator[None]:
    try:
        yield
    except pydantic.ValidationError as err:
        logger.exception(f"Parsing Error! {name}: {id_value}")
        if Settings.validation_errors is True:
            raise err


@contextlib.contextmanager
def get_cached_json(filename: Path, /, *, expected_type: type = object):
    if Settings.cache_to_file is False:
        yield None
        return  # don't process the rest of this context manager
    try:
        # Attempt to see if the data has been fetched already and is on the local system
        json_data = json.loads(filename.read_text(encoding="UTF8"))
        if json_data:
            if object != expected_type:
                if isinstance(json_data, expected_type):
                    yield json_data
                else:
                    yield None
            else:
                yield json_data
    except FileNotFoundError:
        # Otherwise run the function
        yield

        # TODO automatic result caching
        # # Try and write to a file for caching
        # with filesystem_guard("Unable to write cache file"):
        #     filename.write_text(json.dumps(x, ensure_ascii=False, indent=0, default=pydantic_encoder), encoding="utf-8")
