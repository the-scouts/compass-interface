import contextlib
from typing import Optional
from types import TracebackType

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from starlette import status

from compass.api.utility.oauth2 import people_accessor
import compass.core as ci
from compass.core.logger import logger
from compass.core.schemas import member
from compass.core import errors

router = APIRouter()


class ErrorHandling(contextlib.AbstractAsyncContextManager):
    async def __aexit__(self, exc_type: Optional[type[BaseException]], exc_value: Optional[BaseException], exc_traceback: Optional[TracebackType]):
        if not exc_type:
            return True
        if exc_type == errors.CompassPermissionError:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your current role does not have permission to access details for the requested member!")
        if exc_type == errors.CompassNetworkError:
            raise HTTPException(status_code=status.HTTP_424_FAILED_DEPENDENCY, detail="The request to the Compass server failed!")
        if exc_type == errors.CompassError:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="API Error (Core)! Please contact Adam.")
        if exc_type == Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server panic (Interpreter)! Please contact Adam.")


# @router.get("/", response_model=list[member.MemberDetails])
# def get_members(skip: int = 0, limit: int = 100, df: pd.DataFrame = Depends(get_df)):
#     return reports_interface.get_members(df, skip=skip, limit=limit)


@router.get("/me", response_model=member.MemberDetails)
async def get_current_member(people: ci.People = Depends(people_accessor)) -> member.MemberDetails:
    """Gets my personal details."""
    logger.debug(f"Getting /me for {people.membership_number}")
    async with ErrorHandling():
        return people.personal(people.membership_number)


@router.get("/me/roles", response_model=member.MemberRolesCollection)
async def get_current_member_roles(people: ci.People = Depends(people_accessor), volunteer_only: bool = False) -> member.MemberRolesCollection:
    """Gets my roles."""
    logger.debug(f"Getting /me/roles for {people.membership_number}")
    async with ErrorHandling():
        return people.roles(people.membership_number, only_volunteer_roles=volunteer_only)


@router.get("/me/permits", response_model=list[member.MemberPermit])
async def get_current_member_permits(people: ci.People = Depends(people_accessor)) -> list[member.MemberPermit]:
    """Gets my permits."""
    logger.debug(f"Getting /me/permits for {people.membership_number}")
    async with ErrorHandling():
        return people.permits(people.membership_number)


@router.get("/me/training", response_model=member.MemberTrainingTab)
async def get_current_member_training(people: ci.People = Depends(people_accessor)) -> member.MemberTrainingTab:
    """Gets my training."""
    logger.debug(f"Getting /me/training for {people.membership_number}")
    async with ErrorHandling():
        return people.training(people.membership_number)


@router.get("/me/ongoing-learning", response_model=member.MemberMandatoryTraining)
async def get_current_member_ongoing_learning(people: ci.People = Depends(people_accessor)) -> member.MemberMandatoryTraining:
    """Gets my ongoing learning."""
    logger.debug(f"Getting /me/ongoing for {people.membership_number}")
    async with ErrorHandling():
        return people.ongoing_learning(people.membership_number)


@router.get("/me/awards", response_model=list[member.MemberAward])
async def get_current_member_awards(people: ci.People = Depends(people_accessor)) -> list[member.MemberAward]:
    """Gets my awards."""
    logger.debug(f"Getting /me/awards for {people.membership_number}")
    async with ErrorHandling():
        return people.awards(people.membership_number)


@router.get("/me/disclosures", response_model=list[member.MemberDisclosure])
async def get_current_member_disclosures(people: ci.People = Depends(people_accessor)) -> list[member.MemberDisclosure]:
    """Gets my disclosures."""
    logger.debug(f"Getting /me/disclosures for {people.membership_number}")
    async with ErrorHandling():
        return people.disclosures(people.membership_number)


@router.get("/me/latest-disclosure", response_model=Optional[member.MemberDisclosure])
async def get_current_member_latest_disclosure(people: ci.People = Depends(people_accessor)) -> Optional[member.MemberDisclosure]:
    """Gets my latest disclosure."""
    logger.debug(f"Getting /me/latest-disclosure for {people.membership_number}")
    async with ErrorHandling():
        return people.latest_disclosure(people.membership_number)


@router.get("/{compass_id}", response_model=member.MemberDetails)
async def get_member(compass_id: int, people: ci.People = Depends(people_accessor)) -> member.MemberDetails:
    """Gets personal details for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}} for {people.membership_number}")
    async with ErrorHandling():
        return people.personal(compass_id)


@router.get("/{compass_id}/roles", response_model=member.MemberRolesCollection)
async def get_member_roles(compass_id: int, people: ci.People = Depends(people_accessor)):
    """Gets roles for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/roles for {people.membership_number}")
    async with ErrorHandling():
        return people.roles(compass_id, only_volunteer_roles=False)


@router.get("/{compass_id}/permits", response_model=list[member.MemberPermit])
async def get_member_permits(compass_id: int, people: ci.People = Depends(people_accessor)) -> list[member.MemberPermit]:
    """Gets permits for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/permits for {people.membership_number}")
    async with ErrorHandling():
        return people.permits(compass_id)


@router.get("/{compass_id}/training", response_model=member.MemberTrainingTab)
async def get_current_member_training(compass_id: int, people: ci.People = Depends(people_accessor)) -> member.MemberTrainingTab:
    """Gets training for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/training for {people.membership_number}")
    async with ErrorHandling():
        return people.training(compass_id)


@router.get("/{compass_id}/ongoing-learning", response_model=member.MemberMandatoryTraining)
async def get_ongoing_learning(compass_id: int, people: ci.People = Depends(people_accessor)) -> member.MemberMandatoryTraining:
    """Gets ongoing learning for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/ongoing-learning for {people.membership_number}")
    async with ErrorHandling():
        return people.ongoing_learning(compass_id)


@router.get("/{compass_id}/awards", response_model=list[member.MemberAward])
async def get_current_member_awards(compass_id: int, people: ci.People = Depends(people_accessor)) -> list[member.MemberAward]:
    """Gets awards for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/awards for {people.membership_number}")
    async with ErrorHandling():
        return people.awards(compass_id)


@router.get("/{compass_id}/disclosures", response_model=list[member.MemberDisclosure])
async def get_current_member_disclosures(compass_id: int, people: ci.People = Depends(people_accessor)) -> list[member.MemberDisclosure]:
    """Gets disclosures for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/disclosures for {people.membership_number}")
    async with ErrorHandling():
        return people.disclosures(compass_id)


@router.get("/{compass_id}/latest-disclosure", response_model=Optional[member.MemberDisclosure])
async def get_current_member_latest_disclosure(compass_id: int, people: ci.People = Depends(people_accessor)) -> member.MemberDisclosure:
    """Gets the latest disclosure for the member given by `compass_id`."""
    logger.debug(f"Getting /{{compass_id}}/latest-disclosure for {people.membership_number}")
    async with ErrorHandling():
        return people.latest_disclosure(compass_id)
