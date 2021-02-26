from functools import reduce
from pathlib import Path

# import numba
import pandas as pd

import compass.core as ci

PROJECT_ROOT = Path(__file__).absolute().parent.parent.parent.parent


def get_df():
    df = pd.read_feather(PROJECT_ROOT / "all-region.feather")
    try:
        yield df
    finally:
        del df


# @numba.njit
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


def report_to_feather():
    # session = ci.login("user", "pass", role="Regional Administrator")
    # csv_content: bytes = ci.Reports(session).get_report("Region Appointments Report")
    # rep: pd.DataFrame = pd.read_csv(io.BytesIO(csv_content), skiprows=[2])
    rep = pd.read_csv(PROJECT_ROOT.parent / "2020-08-02T00-02-34 - 12047820 (Regional Administrator).csv", skiprows=[2])
    # rep.columns = [tables.MemberFields[c].value for c in rep.columns]  # normalise columns (see Comp Asst)
    rep["name"] = rep["forenames"] + " " + rep["surname"]
    section_cols = ["county_section", "district_section", "scout_group_section"]
    rep["section"] = pd.Series(map(sub, rep[section_cols].to_numpy().tolist()), index=rep.index).astype("string")
    rep["organisation"] = "The Scout Association"
    rep["country"] = "England"  # TODO handle nations
    rep["phone_number"] = rep["phone_number"].astype("string")
    # TODO phone number to string

    rep.to_feather(PROJECT_ROOT.parent / "all-region.feather")
    print("Report Saved to Feather")


def get_members(df: pd.DataFrame, skip: int = 0, limit: int = 100) -> list:
    columns = ["name", "known_as", "forenames", "surname", "postcode", "phone_number", "email"]
    return df[columns].iloc[skip:limit].to_dict("records")


def get_member(df: pd.DataFrame, user_id: int) -> dict:
    columns = ["membership_number", "name", "known_as", "forenames", "surname", "postcode", "phone_number", "email"]
    try:
        row = df.loc[first(user_id, df["membership_number"].to_numpy()), columns]
    except KeyError:
        return dict()

    return row.to_dict()


def get_member_roles(df: pd.DataFrame, user_id: int):
    # fmt: off
    columns = [
        "membership_number", "role_name", "role_start", "role_end", "role_status", "line_manager_number", "line_manager", "review_date",
        "organisation", "country", "region", "county", "district", "group", "section", "ce_check", "appointment_panel_approval",
        "commissioner_approval", "committee_approval", "references", "module_01", "module_02", "module_03", "training_completion_date",
    ]
    # fmt: on
    numeric_columns = ["line_manager_number"]
    string_columns = [c for c in columns if c not in numeric_columns]
    try:
        row = df.loc[df["membership_number"].to_numpy() == user_id].reindex(columns=columns)
        row[string_columns] = row[string_columns].fillna("None").astype(str)
        try:
            row[numeric_columns] = row[numeric_columns].astype("Int32").fillna(-1)
        except TypeError:
            pass
    except KeyError:
        return dict()

    return [{key: val for key, val in role.items() if val not in ["None", -1]} for role in row.to_dict("records")]


def get_member_ongoing(df: pd.DataFrame, user_id: int):
    date_cols = ["safety", "safeguarding", "first_aid", "gdpr"]
    columns = ["membership_number"] + date_cols
    try:
        rows = df.loc[df["membership_number"].to_numpy() == user_id].reindex(columns=columns)
        rows[date_cols] = rows[date_cols].astype("datetime64[D]")
        row = rows.max()
    except KeyError:
        return dict()

    return {k: v.to_pydatetime() if k in date_cols else v for k, v in row.to_dict().items() if v is not pd.NaT}


if __name__ == "__main__":
    report_to_feather()
