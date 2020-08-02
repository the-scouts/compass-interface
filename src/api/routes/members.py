from typing import List

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
import pandas as pd
from sqlalchemy.orm import Session

from api.database.interface import report_to_sql
from src.api.database import interface
from src.api.database.database import get_df
from src.api.schemas import member

router = APIRouter()


@router.get("/", response_model=List[member.Member])
def get_members(skip: int = 0, limit: int = 100, df: pd.DataFrame = Depends(get_df)):
    print("!!")
    users = interface.get_members(df, skip=skip, limit=limit)
    return users


@router.get('/me')
def get_current_user():
    print("!!")
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


@router.get('/{compass_id}/roles')
def get_roles(compass_id: int, df: pd.DataFrame = Depends(get_df)):
    try:
        db_user = interface.get_member_roles(df, user_id=compass_id)
    except (Exception, ) as err:
        print(type(err))
        db_user = None

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get('/{compass_id}/permits')
def get_followed(compass_id: int):
    print("!!")
    pass


if __name__ == '__main__':
    report_to_sql()