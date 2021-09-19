from __future__ import annotations

from types import TracebackType
from typing import NoReturn

from fastapi import HTTPException
from starlette import exceptions
from starlette import status

import compass.core as ci


def http_error(error_code: str, /) -> NoReturn:
    try:
        status_code, message, headers = api_errors_registry[error_code]
        raise HTTPException(status_code, {"code": error_code, "message": message}, headers=headers) from None
    except KeyError as err:
        raise http_error("Z2") from err
    except Exception as err:
        raise http_error("Z0") from err


class ErrorHandling:
    def __init__(self, overrides: dict[type[BaseException], str] | None = None, /):
        self.overrides = overrides or {}

    async def __aenter__(self):
        """Return `self` upon entering the runtime context."""
        return self

    async def __aexit__(self, exc_type: type[BaseException] | None, _val: BaseException | None, _tb: TracebackType | None):
        if not exc_type:
            return True

        if exc_type in self.overrides:
            raise http_error(self.overrides[exc_type])

        # pass-through for Starlette HTTP exceptions
        if issubclass(exc_type, exceptions.HTTPException):
            raise

        # fallback
        if exc_type == ci.CompassPermissionError:
            raise http_error("A30")
        if exc_type == ci.CompassNetworkError:
            raise http_error("R1")
        if exc_type == ci.CompassError:
            raise http_error("Z1")
        if issubclass(exc_type, Exception):
            raise http_error("Z0")


api_errors_registry: dict[str, tuple[int, str, dict[str, str] | None]] = {
    # authentication
    "A1": (status.HTTP_500_INTERNAL_SERVER_ERROR, "Authentication error!", None),
    "A10": (status.HTTP_401_UNAUTHORIZED, "Incorrect username or password!", {"WWW-Authenticate": "Bearer"}),
    "A20": (status.HTTP_401_UNAUTHORIZED, "Could not validate credentials", {"WWW-Authenticate": "Bearer"}),
    "A21": (status.HTTP_401_UNAUTHORIZED, "Could not validate credentials", {"WWW-Authenticate": "Bearer"}),
    "A22": (status.HTTP_401_UNAUTHORIZED, "Could not validate credentials", {"WWW-Authenticate": "Bearer"}),
    "A23": (status.HTTP_401_UNAUTHORIZED, "Could not validate credentials", {"WWW-Authenticate": "Bearer"}),
    "A24": (status.HTTP_401_UNAUTHORIZED, "Could not validate credentials", {"WWW-Authenticate": "Bearer"}),
    "A25": (status.HTTP_401_UNAUTHORIZED, "Could not validate credentials", {"WWW-Authenticate": "Bearer"}),
    "A26": (status.HTTP_401_UNAUTHORIZED, "Your token is malformed! Please get a new token.", {"WWW-Authenticate": "Bearer"}),
    # authorisation
    "A30": (status.HTTP_403_FORBIDDEN, "Your current role does not have permission to do this!", None),
    "A31": (status.HTTP_403_FORBIDDEN, "Your current role does not have permission to access details for the requested member!", None),
    "A32": (status.HTTP_403_FORBIDDEN, "Your current role does not have permission for the requested unit!", None),
    # remote
    "R1": (status.HTTP_503_SERVICE_UNAVAILABLE, "The request to the Compass server failed!", None),
    # hierarchy
    "H10": (status.HTTP_404_NOT_FOUND, "Requested unit ID was not found!", None),
    # other / general
    "Z0": (status.HTTP_500_INTERNAL_SERVER_ERROR, "API Error (Core)! Please contact Adam.", None),
    "Z1": (status.HTTP_500_INTERNAL_SERVER_ERROR, "Server panic (Library)! Please contact Adam.", None),
    "Z2": (status.HTTP_500_INTERNAL_SERVER_ERROR, "Server panic (Error Handling)! Please contact Adam.", None),
}
