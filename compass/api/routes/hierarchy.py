import contextlib
from types import TracebackType
from typing import Optional

import pydantic
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from starlette import status

from compass.api.util.oauth2 import hierarchy_accessor
from compass.api.util import flatten_units
from compass.core import errors
import compass.core as ci
from compass.core.logger import logger

router = APIRouter()
HIERARCHY = flatten_units.load_hierarchy_map()
UnitRecordModel = pydantic.create_model_from_namedtuple(flatten_units.NullableUnitRecord)


class ErrorHandling(contextlib.AbstractAsyncContextManager):
    async def __aexit__(self, exc_type: Optional[type[BaseException]], _val: Optional[BaseException], _tb: Optional[TracebackType]):
        if not exc_type:
            return True
        if exc_type == errors.CompassPermissionError:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Your current role does not have permission for the requested unit!")
        if exc_type == errors.CompassNetworkError:
            raise HTTPException(status.HTTP_424_FAILED_DEPENDENCY, "The request to the Compass server failed!")
        if exc_type == errors.CompassError:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "API Error (Core)! Please contact Adam.")
        if exc_type == Exception:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Server panic (Interpreter)! Please contact Adam.")


@router.get("/", response_model=UnitRecordModel)
async def get_default_unit_data(hierarchy: ci.Hierarchy = Depends(hierarchy_accessor)) -> UnitRecordModel:
    """Gets default hierarchy details."""
    logger.debug(f"Getting /hierarchy/ for {hierarchy.session.membership_number}")
    async with ErrorHandling():
        try:
            return UnitRecordModel(**HIERARCHY[hierarchy.session.hierarchy.unit_id]._asdict())
        except KeyError:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Requested unit ID was not found!")


@router.get("/{unit_id}", response_model=UnitRecordModel)
async def get_unit_data(unit_id: int) -> UnitRecordModel:
    """Gets hierarchy details for given unit ID."""
    logger.debug(f"Getting /hierarchy/{{unit_id}} for {unit_id=}")
    async with ErrorHandling():
        try:
            return UnitRecordModel(**HIERARCHY[unit_id]._asdict())
        except KeyError:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Requested unit ID was not found!")
