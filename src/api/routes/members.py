from typing import List

import pandas as pd
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from src.api.schemas import member
from src.api.utility import reports_interface
from src.api.utility.oauth2 import get_current_user
from src.api.utility.reports_interface import get_df
from src.compass.logon import CompassLogon

router = APIRouter()


@router.get("/", response_model=List[member.Member])
def get_members(skip: int = 0, limit: int = 100, df: pd.DataFrame = Depends(get_df)):
    users = reports_interface.get_members(df, skip=skip, limit=limit)
    return users


@router.get('/me')
def get_current_user(logon: CompassLogon = Depends(get_current_user)):
    return {
        "compass_dict": logon.compass_dict,
        "credentials": logon.credentials,
        "role_to_use": logon.role_to_use,
        "current_role": logon.current_role,
        "roles_dict": logon.roles_dict,
    }


@router.get('/{compass_id}', response_model=member.Member)
def get_member(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    """Gets profile details for given member

    :param df:
    :param compass_id:
    :return:
    """
    try:
        db_user = reports_interface.get_member(df, user_id=compass_id)
    except (Exception, ) as err:
        print(type(err))
        db_user = None

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get('/{compass_id}/roles', response_model=List[member.MemberRole])
def get_member_roles(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    try:
        roles_list = reports_interface.get_member_roles(df, user_id=compass_id)
    except (Exception, ) as err:
        print(type(err))
        roles_list = None

    if not roles_list:
        raise HTTPException(status_code=404, detail="User not found")
    return roles_list


@router.get('/{compass_id}/permits')
def get_member_permits(compass_id: int):
    pass


@router.get('/{compass_id}/ongoing-training', response_model=member.MemberOngoing)
def get_ongoing_training(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    try:
        ongoing = reports_interface.get_member_ongoing(df, user_id=compass_id)
    except (Exception, ) as err:
        print(type(err))
        ongoing = None

    if not ongoing:
        raise HTTPException(status_code=404, detail="User not found")
    return ongoing
