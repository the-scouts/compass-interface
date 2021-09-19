from __future__ import annotations

from types import TracebackType

from fastapi import HTTPException
from starlette import exceptions
from starlette import status

import compass.core as ci


class _HTTPException(HTTPException):
    def __init__(self, error_code: str, status_code: int, message: str, headers: dict[str, str] | None = None) -> None:
        super().__init__(status_code, {"code": error_code, "message": message}, headers)


class ErrorHandling:
    def __init__(self, overrides: dict[type[BaseException], _HTTPException] | None = None, /):
        self.overrides = overrides or {}

    async def __aenter__(self) -> ErrorHandling:
        """Return `self` upon entering the runtime context."""
        return self

    async def __aexit__(self, exc_type: type[BaseException] | None, _val: BaseException | None, _tb: TracebackType | None) -> bool:
        if not exc_type:
            return True

        if exc_type in self.overrides:
            raise self.overrides[exc_type]

        # pass-through for Starlette HTTP exceptions
        if issubclass(exc_type, exceptions.HTTPException):
            return False

        # fallback
        if exc_type == ci.CompassPermissionError:
            raise A30
        if exc_type == ci.CompassNetworkError:
            raise R1
        if exc_type == ci.CompassError:
            raise Z1
        if issubclass(exc_type, Exception):
            raise Z0


# authentication
_auth_headers = {"WWW-Authenticate": "Bearer"}
A1 = _HTTPException("A1", status.HTTP_500_INTERNAL_SERVER_ERROR, "Authentication error!")
A10 = _HTTPException("A10", status.HTTP_401_UNAUTHORIZED, "Incorrect username or password!", _auth_headers)
A20 = _HTTPException("A20", status.HTTP_401_UNAUTHORIZED, "Incorrect username or password!", _auth_headers)
A21 = _HTTPException("A21", status.HTTP_401_UNAUTHORIZED, "Incorrect username or password!", _auth_headers)
A22 = _HTTPException("A22", status.HTTP_401_UNAUTHORIZED, "Incorrect username or password!", _auth_headers)
A23 = _HTTPException("A23", status.HTTP_401_UNAUTHORIZED, "Incorrect username or password!", _auth_headers)
A24 = _HTTPException("A24", status.HTTP_401_UNAUTHORIZED, "Incorrect username or password!", _auth_headers)
A25 = _HTTPException("A25", status.HTTP_401_UNAUTHORIZED, "Incorrect username or password!", _auth_headers)
A26 = _HTTPException("A26", status.HTTP_401_UNAUTHORIZED, "Your token is malformed! Please get a new token.", _auth_headers)

# authorisation
A30 = _HTTPException("A30", status.HTTP_403_FORBIDDEN, "Your current role does not have permission to do this!")
A31 = _HTTPException(
    "A31",
    status.HTTP_403_FORBIDDEN,
    "Your current role does not have permission to access details for the requested member!",
)
A32 = _HTTPException("A32", status.HTTP_403_FORBIDDEN, "Your current role does not have permission for the requested unit!")

# remote
R1 = _HTTPException("R1", status.HTTP_503_SERVICE_UNAVAILABLE, "The request to the Compass server failed!")

# hierarchy
H10 = _HTTPException("H10", status.HTTP_404_NOT_FOUND, "Requested unit ID was not found!")

# other / general
Z0 = _HTTPException("Z0", status.HTTP_500_INTERNAL_SERVER_ERROR, "API Error (Core)! Please contact Adam.")
Z1 = _HTTPException("Z1", status.HTTP_500_INTERNAL_SERVER_ERROR, "Server panic (Library)! Please contact Adam.")
Z2 = _HTTPException("Z2", status.HTTP_500_INTERNAL_SERVER_ERROR, "Server panic (Error Handling)! Please contact Adam.")
