from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from starlette import status

from compass.api.utility.oauth2 import get_current_user
import compass.core as ci
from compass.core.schemas import member

router = APIRouter()


# @router.get("/", response_model=list[member.MemberDetails])
# def get_members(skip: int = 0, limit: int = 100, df: pd.DataFrame = Depends(get_df)):
#     return reports_interface.get_members(df, skip=skip, limit=limit)


@router.get("/me", response_model=member.MemberDetails)
def get_current_member(logon: ci.Logon = Depends(get_current_user)):
    return ci.People(logon)._scraper.get_personal_tab(logon.cn)


# @router.get("/me/roles", response_model=list[member.MemberRole])
# def get_current_member_roles(logon: ci.Logon = Depends(get_current_user), volunteer_only: bool = False):
#     return ci.People(logon).get_roles(logon.cn, keep_non_volunteer_roles=not volunteer_only)


@router.get("/me/permits", response_model=list[member.MemberPermit])
def get_current_member_permits(logon: ci.Logon = Depends(get_current_user)):
    permits = ci.People(logon)._permits_tab(logon.cn)

    if not permits:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permit data were not found")
    return permits


@router.get("/me/ongoing-training", response_model=member.MemberMOGLList)
def get_current_member_ongoing_training(logon: ci.Logon = Depends(get_current_user)):
    ongoing = ci.People(logon)._scraper.get_training_tab(logon.cn, ongoing_only=True)

    if not ongoing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ongoing training data were not found")
    return ongoing


@router.get("/{compass_id}", response_model=member.MemberDetails)
def get_member(compass_id: int, logon: ci.Logon = Depends(get_current_user)):
    """Gets profile details for given member

    Args:
        compass_id: Member to retrieve information for
        logon: ci.Logon object
    """
    try:
        user = ci.People(logon)._scraper.get_personal_tab(compass_id)
    except (Exception,) as err:
        print(type(err))
        user = None

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# @router.get("/{compass_id}/roles", response_model=list[member.MemberRole])
# def get_member_roles(compass_id: int, logon: ci.Logon = Depends(get_current_user)):
#     try:
#         roles_list = ci.People(logon).get_roles(compass_id, keep_non_volunteer_roles=False)
#     except Exception as err:
#         print(type(err))
#         roles_list = None
#
#     if not roles_list:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
#     return roles_list


@router.get("/{compass_id}/permits")
def get_member_permits(compass_id: int, logon: ci.Logon = Depends(get_current_user)):
    permits = ci.People(logon)._permits_tab(compass_id)

    if not permits:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permit data were not found")
    return permits


@router.get("/{compass_id}/ongoing-training", response_model=member.MemberMOGLList)
def get_ongoing_training(compass_id: int, logon: ci.Logon = Depends(get_current_user)):
    try:
        ongoing = ci.People(logon)._scraper.get_training_tab(compass_id, ongoing_only=True)
    except Exception as err:
        print(type(err))
        ongoing = None

    if not ongoing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return ongoing


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
