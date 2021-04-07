from __future__ import annotations

import contextlib
from typing import TYPE_CHECKING

import pydantic

from compass.core.logger import logger
from compass.core.settings import Settings

if TYPE_CHECKING:
    from collections.abc import Iterator


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
