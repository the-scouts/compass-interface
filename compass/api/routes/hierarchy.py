import contextlib
from types import TracebackType
from typing import Optional

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from starlette import status

from compass.api.utility.oauth2 import hierarchy_accessor
from compass.core import errors
import compass.core as ci
from compass.core.logger import logger
from compass.core.schemas import hierarchy as schema

router = APIRouter()


class ErrorHandling(contextlib.AbstractAsyncContextManager):
    async def __aexit__(self, exc_type: Optional[type[BaseException]], exc_value: Optional[BaseException], exc_traceback: Optional[TracebackType]):
        if not exc_type:
            return True
        if exc_type == errors.CompassPermissionError:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your current role does not have permission for the requested unit!")
        if exc_type == errors.CompassNetworkError:
            raise HTTPException(status_code=status.HTTP_424_FAILED_DEPENDENCY, detail="The request to the Compass server failed!")
        if exc_type == errors.CompassError:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="API Error (Core)! Please contact Adam.")
        if exc_type == Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server panic (Interpreter)! Please contact Adam.")


@router.get("/", response_model=schema.UnitData)
async def get_default_hierarchy(hierarchy: ci.Hierarchy = Depends(hierarchy_accessor)) -> schema.UnitData:
    """Gets default hierarchy details."""
    logger.debug(f"Getting /hierarchy/ for {hierarchy.session.membership_number}")
    with ErrorHandling():
        return hierarchy.unit_data(use_default=True, recurse_children=False)
