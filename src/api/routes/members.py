from typing import List

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
import pandas as pd

from src.api.database import interface
from src.api.database.database import get_df
from src.api.schemas import member

router = APIRouter()


@router.get("/", response_model=List[member.Member])
def get_members(skip: int = 0, limit: int = 100, df: pd.DataFrame = Depends(get_df)):
    users = interface.get_members(df, skip=skip, limit=limit)
    return users


@router.get('/me')
def get_current_user():
    pass


@router.get('/{compass_id}', response_model=member.Member)
def get_member(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    """Gets profile details for given member

    :param df:
    :param compass_id:
    :return:
    """
    try:
        db_user = interface.get_member(df, user_id=compass_id)
    except (Exception, ) as err:
        print(type(err))
        db_user = None

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get('/{compass_id}/roles', response_model=List[member.MemberRole])
def get_roles(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    try:
        roles_list = interface.get_member_roles(df, user_id=compass_id)
    except (Exception, ) as err:
        print(type(err))
        roles_list = None

    if not roles_list:
        raise HTTPException(status_code=404, detail="User not found")
    return roles_list


@router.get('/{compass_id}/permits')
def get_followed(compass_id: int):
    pass


@router.get('/{compass_id}/ongoing-training', )
def get_ongoing(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    try:
        ongoing = interface.get_member_roles(df, user_id=compass_id)
    except (Exception, ) as err:
        print(type(err))
        ongoing = None

    if not ongoing:
        raise HTTPException(status_code=404, detail="User not found")
    return ongoing
