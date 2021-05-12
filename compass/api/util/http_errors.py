from __future__ import annotations

import contextlib
from types import TracebackType
from typing import NoReturn

from fastapi import HTTPException
from starlette import exceptions
from starlette import status

from compass.core import errors


def http_error(status_code: int, error_code: str, message: str, /, headers: dict[str, str] | None = None) -> NoReturn:
    raise HTTPException(status_code, {"code": error_code, "message": message}, headers=headers) from None


def auth_error(error_code: str, message: str, /, status_code: int = status.HTTP_401_UNAUTHORIZED) -> NoReturn:
    raise http_error(status_code, error_code, message, headers={"WWW-Authenticate": "Bearer"})


class ErrorHandling(contextlib.AbstractAsyncContextManager):
    def __init__(self, overrides: dict[type[errors.CompassError], tuple[int, str, str]] | None = None, /):
        self.overrides = overrides or {}

    async def __aexit__(self, exc_type: type[BaseException] | None, _val: BaseException | None, _tb: TracebackType | None):
        if not exc_type:
            return True

        if exc_type in self.overrides:
            status_code, error_code, message = self.overrides[exc_type]
            raise http_error(status_code, error_code, message)

        # pass-through for Starlette HTTP exceptions
        if issubclass(exc_type, exceptions.HTTPException):
            raise

        # fallback
        if exc_type == errors.CompassPermissionError:
            raise http_error(status.HTTP_403_FORBIDDEN, "A30", "Your current role does not have permission to do this!")
        if exc_type == errors.CompassNetworkError:
            raise http_error(status.HTTP_503_SERVICE_UNAVAILABLE, "R1", "The request to the Compass server failed!")
        if exc_type == errors.CompassError:
            raise http_error(status.HTTP_500_INTERNAL_SERVER_ERROR, "Z1", "API Error (Core)! Please contact Adam.")
        if issubclass(exc_type, Exception):
            raise http_error(status.HTTP_500_INTERNAL_SERVER_ERROR, "Z0", "Server panic (Interpreter)! Please contact Adam.")
