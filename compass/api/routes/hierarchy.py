from fastapi import APIRouter
from fastapi import Depends

from compass.api.utility.oauth2 import hierarchy_accessor
import compass.core as ci
from compass.core.logger import logger
from compass.core.schemas import hierarchy as schema


router = APIRouter()


@router.get("/", response_model=schema.UnitData)
async def get_default_hierarchy(hierarchy: ci.Hierarchy = Depends(hierarchy_accessor)) -> schema.UnitData:
    """Gets default hierarchy details."""
    logger.debug(f"Getting /hierarchy/ for {hierarchy.session.membership_number}")
    return hierarchy.unit_data(use_default=True)
