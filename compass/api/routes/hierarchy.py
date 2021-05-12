from fastapi import APIRouter
from fastapi import Depends
from starlette import status

from compass.api.schemas.unit_records import UnitRecordModel
from compass.api.util import flatten_units
from compass.api.util import http_errors
from compass.api.util.oauth2 import hierarchy_accessor
from compass.core import errors
import compass.core as ci
from compass.core.logger import logger

router = APIRouter()
cpe_hierarchy = status.HTTP_403_FORBIDDEN, "A32", "Your current role does not have permission for the requested unit!"
error_handler = http_errors.ErrorHandling({errors.CompassPermissionError: cpe_hierarchy})
HIERARCHY = flatten_units.load_hierarchy_map()


@router.get("/", response_model=UnitRecordModel)
async def get_default_unit_data(hierarchy: ci.Hierarchy = Depends(hierarchy_accessor)) -> UnitRecordModel:
    """Gets default hierarchy details."""
    logger.debug(f"Getting /hierarchy/ for {hierarchy.session.membership_number}")
    async with error_handler:
        try:
            return UnitRecordModel(**HIERARCHY[hierarchy.session.hierarchy.unit_id]._asdict())
        except KeyError:
            raise http_errors.http_error(status.HTTP_404_NOT_FOUND, "H10", "Requested unit ID was not found!")


@router.get("/{unit_id}", response_model=UnitRecordModel)
async def get_unit_data(unit_id: int) -> UnitRecordModel:
    """Gets hierarchy details for given unit ID."""
    logger.debug(f"Getting /hierarchy/{{unit_id}} for {unit_id=}")
    async with error_handler:
        try:
            return UnitRecordModel(**HIERARCHY[unit_id]._asdict())
        except KeyError:
            raise http_errors.http_error(status.HTTP_404_NOT_FOUND, "H10", "Requested unit ID was not found!")
