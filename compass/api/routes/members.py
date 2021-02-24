from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
import pandas as pd

import compass as ci
from compass.api.utility import reports_interface
from compass.api.utility.compass_people_interface import get_ongoing_learning_scraper
from compass.api.utility.oauth2 import get_current_user
from compass.api.utility.reports_interface import get_df
from compass.core.schemas import member

router = APIRouter()


@router.get("/", response_model=List[member.MemberDetails])
def get_members(skip: int = 0, limit: int = 100, df: pd.DataFrame = Depends(get_df)):
    users = reports_interface.get_members(df, skip=skip, limit=limit)
    return users


@router.get("/me", response_model=member.MemberDetails)
def get_current_member(logon: ci.Logon = Depends(get_current_user)):
    people_scraper = ci.People(logon)._scraper
    personal_data = people_scraper.get_personal_tab(logon.cn)
    return personal_data


@router.get("/me/roles", response_model=List[member.MemberRole])
def get_current_member_roles(logon: ci.Logon = Depends(get_current_user), volunteer_only: bool = False):
    people = ci.People(logon)
    roles_list = people.get_roles(logon.cn, keep_non_volunteer_roles=not volunteer_only)
    return roles_list


@router.get("/me/permits", response_model=List[member.MemberPermit])
def get_current_member_permits(logon: ci.Logon = Depends(get_current_user)):
    people_scraper = ci.People(logon)._scraper
    permits = people_scraper.get_permits_tab(logon.cn)

    if not permits:
        raise HTTPException(status_code=404, detail="Permit data were not found")
    return permits


@router.get("/me/ongoing-training", response_model=member.MemberMOGLList)
def get_current_member_ongoing_training(logon: ci.Logon = Depends(get_current_user)):
    ongoing = get_ongoing_learning_scraper(logon)

    if not ongoing:
        raise HTTPException(status_code=404, detail="Ongoing training data were not found")
    return ongoing


@router.get("/{compass_id}", response_model=member.MemberDetails)
def get_member(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    """Gets profile details for given member

    :param df:
    :param compass_id:
    :return:
    """
    try:
        db_user = reports_interface.get_member(df, user_id=compass_id)
    except (Exception,) as err:
        print(type(err))
        db_user = None

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get("/{compass_id}/roles", response_model=List[member.MemberRole])
def get_member_roles(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    try:
        roles_list = reports_interface.get_member_roles(df, user_id=compass_id)
    except (Exception,) as err:
        print(type(err))
        roles_list = None

    if not roles_list:
        raise HTTPException(status_code=404, detail="User not found")
    return roles_list


@router.get("/{compass_id}/permits")
def get_member_permits(compass_id: int):
    pass


@router.get("/{compass_id}/ongoing-training", response_model=member.MemberMOGLList)
def get_ongoing_training(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    try:
        ongoing = reports_interface.get_member_ongoing(df, user_id=compass_id)
    except (Exception,) as err:
        print(type(err))
        ongoing = None

    if not ongoing:
        raise HTTPException(status_code=404, detail="User not found")
    return ongoing
