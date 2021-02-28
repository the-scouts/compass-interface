from typing import Optional

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from starlette import status

from compass.api.utility.oauth2 import people_accessor
import compass.core as ci
from compass.core.schemas import member

router = APIRouter()


# @router.get("/", response_model=list[member.MemberDetails])
# def get_members(skip: int = 0, limit: int = 100, df: pd.DataFrame = Depends(get_df)):
#     return reports_interface.get_members(df, skip=skip, limit=limit)


@router.get("/me", response_model=member.MemberDetails)
def get_current_member(people: ci.People = Depends(people_accessor)) -> member.MemberDetails:
    return people.personal(people._scraper.cn)  # NoQA


# @router.get("/me/roles", response_model=list[member.MemberRole])
# def get_current_member_roles(people: ci.People = Depends(people_accessor), volunteer_only: bool = False):
#     return people.get_roles(people._scraper.cn, keep_non_volunteer_roles=not volunteer_only)  # NoQA


@router.get("/me/permits", response_model=member.MemberPermitsList)
def get_current_member_permits(people: ci.People = Depends(people_accessor)) -> member.MemberPermitsList:
    permits = people.permits(people._scraper.cn)  # NoQA

    if not permits:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permit data were not found")
    return permits


# @router.get("/me/training", response_model=member.MemberTrainingTab)
# def get_current_member_training(people: ci.People = Depends(people_accessor)) -> member.MemberTrainingTab:
#     training = people.training(people._scraper.cn)  # NoQA
#
#     if not training:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
#     return training


@router.get("/me/ongoing-learning", response_model=member.MemberMOGLList)
def get_current_member_ongoing_learning(people: ci.People = Depends(people_accessor)) -> member.MemberMOGLList:
    ongoing = people.ongoing_learning(people._scraper.cn)  # NoQA

    if not ongoing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
    return ongoing


@router.get("/me/awards", response_model=list[member.MemberAward])
def get_current_member_awards(people: ci.People = Depends(people_accessor)) -> list[member.MemberAward]:
    awards = people.awards(people._scraper.cn)  # NoQA

    if not awards:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
    return awards


@router.get("/me/disclosures", response_model=list[member.MemberDisclosure])
def get_current_member_disclosures(people: ci.People = Depends(people_accessor)) -> list[member.MemberDisclosure]:
    disclosures = people.disclosures(people._scraper.cn)  # NoQA

    if not disclosures:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
    return disclosures


@router.get("/me/latest-disclosure", response_model=Optional[member.MemberDisclosure])
def get_current_member_latest_disclosure(people: ci.People = Depends(people_accessor)) -> Optional[member.MemberDisclosure]:
    disclosure = people.latest_disclosure(people._scraper.cn)  # NoQA

    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
    return disclosure


@router.get("/{compass_id}", response_model=member.MemberDetails)
def get_member(compass_id: int, people: ci.People = Depends(people_accessor)) -> member.MemberDetails:
    """Gets profile details for given member

    Args:
        compass_id: Member to retrieve information for
        people: People object
    """
    try:
        user = people.personal(compass_id)
    except (Exception,) as err:
        print(type(err))
        user = None

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# @router.get("/{compass_id}/roles", response_model=list[member.MemberRole])
# def get_member_roles(compass_id: int, people: ci.People = Depends(people_accessor)):
#     try:
#         roles_list = people.get_roles(compass_id, keep_non_volunteer_roles=False)
#     except Exception as err:
#         print(type(err))
#         roles_list = None
#
#     if not roles_list:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
#     return roles_list


@router.get("/{compass_id}/permits", response_model=member.MemberPermitsList)
def get_member_permits(compass_id: int, people: ci.People = Depends(people_accessor)) -> member.MemberPermitsList:
    permits = people.permits(compass_id)

    if not permits:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permit data were not found")
    return permits


# @router.get("/{compass_id}/training", response_model=member.MemberTrainingTab)
# def get_current_member_training(compass_id: int, people: ci.People = Depends(people_accessor)) -> member.MemberTrainingTab:
#     training = people.training(compass_id)
#
#     if not training:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
#     return training


@router.get("/{compass_id}/ongoing-learning", response_model=member.MemberMOGLList)
def get_ongoing_learning(compass_id: int, people: ci.People = Depends(people_accessor)) -> member.MemberMOGLList:
    try:
        ongoing = people.ongoing_learning(compass_id)
    except Exception as err:
        print(type(err))
        ongoing = None

    if not ongoing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return ongoing


@router.get("/{compass_id}/awards", response_model=list[member.MemberAward])
def get_current_member_awards(compass_id: int, people: ci.People = Depends(people_accessor)) -> list[member.MemberAward]:
    awards = people.awards(compass_id)

    if not awards:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
    return awards


@router.get("/{compass_id}/disclosures", response_model=list[member.MemberDisclosure])
def get_current_member_disclosures(compass_id: int, people: ci.People = Depends(people_accessor)) -> list[member.MemberDisclosure]:
    disclosures = people.disclosures(compass_id)

    if not disclosures:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
    return disclosures


@router.get("/{compass_id}/latest-disclosure", response_model=Optional[member.MemberDisclosure])
def get_current_member_latest_disclosure(compass_id: int, people: ci.People = Depends(people_accessor)) -> member.MemberDisclosure:
    disclosure = people.latest_disclosure(compass_id)

    if not disclosure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
    return disclosure


# @router.get("/{compass_id}", response_model=member.MemberDetails)
# def get_member(compass_id: int, df: pd.DataFrame = Depends(get_df)):
#     """Gets profile details for given member
#
#     Args:
#         compass_id: Member to retrieve information for
#         df: DataFrame with cached member data
#     """
#     try:
#         db_user = reports_interface.get_member(df, user_id=compass_id)
#     except (Exception,) as err:
#         print(type(err))
#         db_user = None
#
#     if not db_user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return db_user
#
#
# @router.get("/{compass_id}/roles", response_model=list[member.MemberRole])
# def get_member_roles(compass_id: int, df: pd.DataFrame = Depends(get_df)):
#     try:
#         roles_list = reports_interface.get_member_roles(df, user_id=compass_id)
#     except Exception as err:
#         print(type(err))
#         roles_list = None
#
#     if not roles_list:
#         raise HTTPException(status_code=404, detail="User not found")
#     return roles_list
#
#
# @router.get("/{compass_id}/permits")
# def get_member_permits(compass_id: int):
#     pass
#
#
# @router.get("/{compass_id}/ongoing-training", response_model=member.MemberMOGLList)
# def get_ongoing_training(compass_id: int, df: pd.DataFrame = Depends(get_df)):
#     try:
#         ongoing = reports_interface.get_member_ongoing(df, user_id=compass_id)
#     except Exception as err:
#         print(type(err))
#         ongoing = None
#
#     if not ongoing:
#         raise HTTPException(status_code=404, detail="User not found")
#     return ongoing
