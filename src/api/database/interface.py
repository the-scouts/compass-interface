import io
import time
from functools import reduce

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


def or_(a, b):
    return a or b


def sub(sub_list):
    return reduce(or_, sub_list)


def report_to_sql():
    session = CompassLogon(auth_keys, 'Regional Administrator')
    csv_content: bytes = get_report(session, "Region Appointments Report")
    rep: pd.DataFrame = pd.read_csv(io.BytesIO(csv_content), skiprows=[2])
    rep.columns = [tables.MemberFields[c].value for c in rep.columns]
    rep["name"] = rep['forenames'] + ' ' + rep['surname']
    section_cols = ["county_section", "district_section", "scout_group_section"]
    rep["section"] = pd.Series(map(sub, rep[section_cols].to_numpy().tolist()), index=rep.index).astype(str)
    rep["organisation"] = "The Scout Association"
    rep["country"] = "England"  # TODO handle nations

    # TODO phone number to string

    rep.to_feather("temp-path.feather")
    print("Report Saved to Feather")


def get_members(df: pd.DataFrame, skip: int = 0, limit: int = 100) -> list:
    columns = ["name", "known_as", "forenames", "surname", "postcode", "phone_number", "email", ]
    return df[columns].iloc[skip:limit].to_dict("records")


def get_member(df: pd.DataFrame, user_id: int) -> dict:
    columns = ["membership_number", "name", "known_as", "forenames", "surname", "postcode", "phone_number", "email", ]
    try:
        row = df.loc[first(user_id, df["membership_number"].to_numpy()), columns]
    except KeyError:
        return dict()

    return row.to_dict()


def get_member_roles(df: pd.DataFrame, user_id: int):
    columns = [
        'role_name', 'role_start', 'role_end', 'role_status', 'line_manager_number', 'line_manager', 'review_date',
        'organisation', 'country', 'region', 'county', 'district', 'group', 'section', 'ce_check', 'appointment_panel_approval',
        'commissioner_approval', 'committee_approval', 'references', 'module_01', 'module_02', 'module_03', 'training_completion_date',
    ]
    try:
        row = df.loc[df["membership_number"].to_numpy() == user_id, lambda d: [c for c in columns if c in d.columns]]
        str_cols = [c for c in row.columns if c not in ['line_manager_number']]
        num_cols = ['line_manager_number']
        row[str_cols] = row[str_cols].fillna("").astype(str)
        row[num_cols] = row[num_cols].fillna(0)
    except KeyError:
        return dict()

    return row.to_dict("records")


# def create_user(db: Session, user: member.UserCreate) -> tables.User:
#     serialised = base64.b64encode(bytes(user.password, "UTF-8")).decode("UTF-8")
#     db_user = tables.User(username=user.username, auth=serialised)
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)
#     print(type(db_user))
#     return db_user
