from fastapi import APIRouter
from fastapi import Depends
from starlette import status

from compass.api.schemas.unit_records import UnitRecordModel
from compass.api.util import flatten_units
from compass.api.util import http_errors
from compass.api.util.oauth2 import ci_accessor
from compass.core import errors
import compass.core as ci
from compass.core.logger import logger
from compass.core.schemas import hierarchy as schema

router = APIRouter()
cpe_hierarchy = status.HTTP_403_FORBIDDEN, "A32", "Your current role does not have permission for the requested unit!"
error_handler = http_errors.ErrorHandling({errors.CompassPermissionError: cpe_hierarchy})
HIERARCHY = flatten_units.load_hierarchy_map()


async def get_unit(unit_id: int) -> UnitRecordModel:
    unit = HIERARCHY.get(unit_id)
    if unit is None:
        raise http_errors.http_error(status.HTTP_404_NOT_FOUND, "H10", "Requested unit ID was not found!")
    return UnitRecordModel(
        name=unit.name,
        parent=unit.parent,
        children=[schema.HierarchyUnit(unit_id=k, name=v) for k, v in unit.children.items()],
        sections=[schema.HierarchyUnit(unit_id=k, name=v) for k, v in unit.sections.items()],
    )


@router.get("/", response_model=UnitRecordModel)
async def get_default_unit_data(api: ci.CompassInterface = Depends(ci_accessor)) -> UnitRecordModel:
    """Gets default hierarchy details."""
    logger.debug(f"Getting /hierarchy/ for {api.user.membership_number}")
    async with error_handler:
        return await get_unit(api.hierarchy.default_hierarchy.unit_id)


@router.get("/{unit_id}", response_model=UnitRecordModel)
async def get_unit_data(unit_id: int) -> UnitRecordModel:
    """Gets hierarchy details for given unit ID."""
    logger.debug(f"Getting /hierarchy/{{unit_id}} for {unit_id=}")
    async with error_handler:
        return await get_unit(unit_id)


@router.get("/{unit_id}/children", response_model=list[schema.HierarchyUnit])
async def get_unit_data(unit_id: int) -> list[schema.HierarchyUnit]:
    """Gets hierarchy details for given unit ID."""
    logger.debug(f"Getting /hierarchy/{{unit_id}} for {unit_id=}")
    async with error_handler:
        return (await get_unit(unit_id)).children


@router.get("/{unit_id}/sections", response_model=list[schema.HierarchyUnit])
async def get_unit_data(unit_id: int) -> list[schema.HierarchyUnit]:
    """Gets hierarchy details for given unit ID."""
    logger.debug(f"Getting /hierarchy/{{unit_id}} for {unit_id=}")
    async with error_handler:
        return (await get_unit(unit_id)).sections


@router.get("/{unit_id}/members", response_model=list[schema.HierarchyMember])
async def get_unit_members(unit_id: int, api: ci.CompassInterface = Depends(ci_accessor)) -> list[schema.HierarchyMember]:
    """Gets hierarchy details for given unit ID."""
    logger.debug(f"Getting /hierarchy/{{unit_id}} for {unit_id=}")
    async with error_handler:
        return api.hierarchy.unit_members(unit_id)
