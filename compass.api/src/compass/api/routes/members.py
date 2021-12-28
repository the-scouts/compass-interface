from typing import Optional

from fastapi import APIRouter
from fastapi import Depends

from compass.api.util import http_errors
from compass.api.util.oauth2 import ci_user
import compass.core as ci
from compass.core.logger import logger

router = APIRouter()
error_handler = http_errors.ErrorHandling({ci.CompassPermissionError: http_errors.A31})


# @router.get("/", response_model=list[ci.MemberDetails])
# def get_members(skip: int = 0, limit: int = 100, df: pd.DataFrame = Depends(get_df)):
#     return reports_interface.get_members(df, skip=skip, limit=limit)


@router.get("/me", response_model=ci.MemberDetails)
async def get_current_member(api: ci.CompassInterface = Depends(ci_user)) -> ci.MemberDetails:
    """Gets my personal details."""
    logger.debug(f"Getting /me for {api.user.membership_number}")
    async with error_handler:
        return api.people.personal(api.user.membership_number)


@router.get("/me/roles", response_model=ci.MemberRolesCollection)
async def get_current_member_roles(api: ci.CompassInterface = Depends(ci_user), volunteer_only: bool = False) -> ci.MemberRolesCollection:
    """Gets my roles."""
    logger.debug(f"Getting /me/roles for {api.user.membership_number}")
    async with error_handler:
        return api.people.roles(api.user.membership_number, only_volunteer_roles=volunteer_only)


@router.get("/me/permits", response_model=list[ci.MemberPermit])
async def get_current_member_permits(api: ci.CompassInterface = Depends(ci_user)) -> list[ci.MemberPermit]:
    """Gets my permits."""
    logger.debug(f"Getting /me/permits for {api.user.membership_number}")
    async with error_handler:
        return api.people.permits(api.user.membership_number)


@router.get("/me/training", response_model=ci.MemberTrainingTab)
async def get_current_member_training(api: ci.CompassInterface = Depends(ci_user)) -> ci.MemberTrainingTab:
    """Gets my training."""
    logger.debug(f"Getting /me/training for {api.user.membership_number}")
    async with error_handler:
        return api.people.training(api.user.membership_number)


@router.get("/me/ongoing-learning", response_model=ci.MemberMandatoryTraining)
async def get_current_member_ongoing_learning(api: ci.CompassInterface = Depends(ci_user)) -> ci.MemberMandatoryTraining:
    """Gets my ongoing learning."""
    logger.debug(f"Getting /me/ongoing for {api.user.membership_number}")
    async with error_handler:
        return api.people.ongoing_learning(api.user.membership_number)


@router.get("/me/awards", response_model=list[ci.MemberAward])
async def get_current_member_awards(api: ci.CompassInterface = Depends(ci_user)) -> list[ci.MemberAward]:
    """Gets my awards."""
    logger.debug(f"Getting /me/awards for {api.user.membership_number}")
    async with error_handler:
        return api.people.awards(api.user.membership_number)


@router.get("/me/disclosures", response_model=list[ci.MemberDisclosure])
async def get_current_member_disclosures(api: ci.CompassInterface = Depends(ci_user)) -> list[ci.MemberDisclosure]:
    """Gets my disclosures."""
    logger.debug(f"Getting /me/disclosures for {api.user.membership_number}")
    async with error_handler:
        return api.people.disclosures(api.user.membership_number)


@router.get("/me/latest-disclosure", response_model=Optional[ci.MemberDisclosure])
async def get_current_member_latest_disclosure(api: ci.CompassInterface = Depends(ci_user)) -> Optional[ci.MemberDisclosure]:
    """Gets my latest disclosure."""
    logger.debug(f"Getting /me/latest-disclosure for {api.user.membership_number}")
    async with error_handler:
        return api.people.latest_disclosure(api.user.membership_number)


@router.get("/{compass_id}", response_model=ci.MemberDetails)
async def get_member(compass_id: int, api: ci.CompassInterface = Depends(ci_user)) -> ci.MemberDetails:
    """Gets personal details for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}} for {api.user.membership_number}")
    async with error_handler:
        return api.people.personal(compass_id)


@router.get("/{compass_id}/roles", response_model=ci.MemberRolesCollection)
async def get_member_roles(compass_id: int, api: ci.CompassInterface = Depends(ci_user)):
    """Gets roles for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/roles for {api.user.membership_number}")
    async with error_handler:
        return api.people.roles(compass_id, only_volunteer_roles=False)


@router.get("/{compass_id}/permits", response_model=list[ci.MemberPermit])
async def get_member_permits(compass_id: int, api: ci.CompassInterface = Depends(ci_user)) -> list[ci.MemberPermit]:
    """Gets permits for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/permits for {api.user.membership_number}")
    async with error_handler:
        return api.people.permits(compass_id)


@router.get("/{compass_id}/training", response_model=ci.MemberTrainingTab)
async def get_training(compass_id: int, api: ci.CompassInterface = Depends(ci_user)) -> ci.MemberTrainingTab:
    """Gets training for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/training for {api.user.membership_number}")
    async with error_handler:
        return api.people.training(compass_id)


@router.get("/{compass_id}/ongoing-learning", response_model=ci.MemberMandatoryTraining)
async def get_ongoing_learning(compass_id: int, api: ci.CompassInterface = Depends(ci_user)) -> ci.MemberMandatoryTraining:
    """Gets ongoing learning for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/ongoing-learning for {api.user.membership_number}")
    async with error_handler:
        return api.people.ongoing_learning(compass_id)


@router.get("/{compass_id}/awards", response_model=list[ci.MemberAward])
async def get_awards(compass_id: int, api: ci.CompassInterface = Depends(ci_user)) -> list[ci.MemberAward]:
    """Gets awards for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/awards for {api.user.membership_number}")
    async with error_handler:
        return api.people.awards(compass_id)


@router.get("/{compass_id}/disclosures", response_model=list[ci.MemberDisclosure])
async def get_disclosures(compass_id: int, api: ci.CompassInterface = Depends(ci_user)) -> list[ci.MemberDisclosure]:
    """Gets disclosures for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/disclosures for {api.user.membership_number}")
    async with error_handler:
        return api.people.disclosures(compass_id)


@router.get("/{compass_id}/latest-disclosure", response_model=Optional[ci.MemberDisclosure])
async def get_latest_disclosure(compass_id: int, api: ci.CompassInterface = Depends(ci_user)) -> Optional[ci.MemberDisclosure]:
    """Gets the latest disclosure for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/latest-disclosure for {api.user.membership_number}")
    async with error_handler:
        return api.people.latest_disclosure(compass_id)
