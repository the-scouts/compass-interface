from fastapi import APIRouter
from fastapi import Depends

from compass.api.schemas.unit_records import UnitRecordModel
from compass.api.util import flatten_units
from compass.api.util import http_errors
from compass.api.util.oauth2 import ci_user
import compass.core as ci
from compass.core.logger import logger

router = APIRouter()
error_handler = http_errors.ErrorHandling({ci.CompassPermissionError: "A32"})
HIERARCHY = flatten_units.load_hierarchy_map()


async def get_unit(unit_id: int) -> UnitRecordModel:
    unit = HIERARCHY.get(unit_id)
    if unit is None:
        raise http_errors.http_error("H10")
    return UnitRecordModel(
        name=unit.name,
        parent=unit.parent,
        children=[ci.HierarchyUnit(unit_id=k, name=v) for k, v in unit.children.items()],
        sections=[ci.HierarchyUnit(unit_id=k, name=v) for k, v in unit.sections.items()],
    )


@router.get("/", response_model=UnitRecordModel)
async def get_default_unit_data(api: ci.CompassInterface = Depends(ci_user)) -> UnitRecordModel:
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


@router.get("/{unit_id}/children", response_model=list[ci.HierarchyUnit])
async def get_unit_data(unit_id: int) -> list[ci.HierarchyUnit]:
    """Gets hierarchy details for given unit ID."""
    logger.debug(f"Getting /hierarchy/{{unit_id}} for {unit_id=}")
    async with error_handler:
        return (await get_unit(unit_id)).children


@router.get("/{unit_id}/sections", response_model=list[ci.HierarchyUnit])
async def get_unit_data(unit_id: int) -> list[ci.HierarchyUnit]:
    """Gets hierarchy details for given unit ID."""
    logger.debug(f"Getting /hierarchy/{{unit_id}} for {unit_id=}")
    async with error_handler:
        return (await get_unit(unit_id)).sections


@router.get("/{unit_id}/members", response_model=list[ci.HierarchyMember])
async def get_unit_members(unit_id: int, api: ci.CompassInterface = Depends(ci_user)) -> list[ci.HierarchyMember]:
    """Gets hierarchy details for given unit ID."""
    logger.debug(f"Getting /hierarchy/{{unit_id}} for {unit_id=}")
    async with error_handler:
        return api.hierarchy.unit_members(unit_id)
