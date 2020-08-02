import io
import time

import numba
import pandas as pd

from script import auth_keys
from src.api.database import tables
from src.compass.logon import CompassLogon
from src.compass.reports import get_report


@numba.njit
def first(item, vec):
    """return the index of the first occurrence of item in vec"""
    for i, v in enumerate(vec):
        if item == v:
            return i
    return -1


def report_to_sql():
    session = CompassLogon(auth_keys, 'Regional Administrator')
    csv_content: bytes = get_report(session, "Region Appointments Report")
    rep: pd.DataFrame = pd.read_csv(io.BytesIO(csv_content), skiprows=[2])
    rep.columns = [tables.MemberFields[c].value for c in rep.columns]
    rep["name"] = rep['forenames'] + ' ' + rep['surname']
    # TODO phone number to string

    rep.to_feather("temp-path.feather")
    print("Report Saved to Feather")


def get_member(df: pd.DataFrame, user_id: int):
    columns = ["membership_number", "name", "known_as", "forenames", "surname", "postcode", "phone_number", "email", ]
    try:
        row = df.loc[first(user_id, df["membership_number"].to_numpy()), columns]
    except KeyError:
        return dict()

    return row.to_dict()


def get_users(df: pd.DataFrame, skip: int = 0, limit: int = 100):
    columns = ["name", "known_as", "forenames", "surname", "postcode", "phone_number", "email", ]
    return df[columns].iloc[skip:limit].to_dict("records")


# def create_user(db: Session, user: member.UserCreate) -> tables.User:
#     serialised = base64.b64encode(bytes(user.password, "UTF-8")).decode("UTF-8")
#     db_user = tables.User(username=user.username, auth=serialised)
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)
#     print(type(db_user))
#     return db_user
