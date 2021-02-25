from __future__ import annotations

import datetime
from typing import Literal, Optional

import pydantic

TYPES_CRUD_STRING = pydantic.constr(regex=r"^[CRUD]{0,4}$")


class CompassPropsNav(pydantic.BaseModel):
    action: Optional[Literal["None"]] = pydantic.Field(None, alias="Action")
    start_no: Optional[int] = pydantic.Field(None, alias="StartNo")
    start_page: Optional[int] = pydantic.Field(None, alias="StartPage")


class CompassPropsPage(pydantic.BaseModel):
    use_cn: Optional[int] = pydantic.Field(None, alias="UseCN")
    hide_badges: Optional[bool] = pydantic.Field(None, alias="HideBadges")
    croc: Optional[Literal["OK"]] = pydantic.Field(None, alias="Croc")
    hide_nominations: Optional[bool] = pydantic.Field(None, alias="HideNominations")
    can_delete_ogl_hrs: Optional[bool] = pydantic.Field(None, alias="CanDeleteOGLHrs")
    fold_name: Optional[Literal["MP_"]] = pydantic.Field(None, alias="FoldName")


class CompassPropsCRUD(pydantic.BaseModel):
    mdis: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="MDIS")
    roles: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="ROLES")
    pemd: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="PEMD")
    mmmd: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="MMMD")
    mvid: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="MVID")
    perm: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="PERM")
    trn: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="TRN")


class CompassPropsUser(pydantic.BaseModel):
    is_me: Optional[bool] = pydantic.Field(None, alias="IsMe")


class CompassPropsMasterSSO(pydantic.BaseModel):
    on: Optional[int] = pydantic.Field(None, alias="ON")


class CompassPropsMasterUser(pydantic.BaseModel):
    cn: Optional[int] = pydantic.Field(None, alias="CN")
    mrn: Optional[int] = pydantic.Field(None, alias="MRN")
    on: Optional[int] = pydantic.Field(None, alias="ON")
    lvl: Optional[Literal["ORG", "ORST", "CNTR", "CNST", "REG", "RGST", "CNTY", "CTST", "DIST", "DTST", "SGRP", "SGST"]] = pydantic.Field(None, alias="LVL")
    jk: Optional[str] = pydantic.Field(None, alias="JK")


class CompassPropsMasterConst(pydantic.BaseModel):
    wales: Optional[int] = pydantic.Field(None, alias="Wales")
    scotland: Optional[int] = pydantic.Field(None, alias="Scotland")
    over_seas: Optional[int] = pydantic.Field(None, alias="OverSeas")
    hq: Optional[int] = pydantic.Field(None, alias="HQ")


class CompassPropsMasterSys(pydantic.BaseModel):
    session_id: Optional[str] = pydantic.Field(None, alias="SessionID")
    safe_json: Optional[bool] = pydantic.Field(None, alias="SafeJSON")
    web_path: Optional[pydantic.HttpUrl] = pydantic.Field(None, alias="WebPath")
    text_size: Optional[int] = pydantic.Field(None, alias="TextSize")
    timout: Optional[int] = pydantic.Field(None, alias="Timout")
    rest: Optional[bool] = pydantic.Field(None, alias="REST")
    hard_time: Optional[datetime.time] = pydantic.Field(None, alias="HardTime")
    hard_expiry: Optional[str] = pydantic.Field(None, alias="HardExpiry")
    timeout_extension: Optional[int] = pydantic.Field(None, alias="TimeoutExtension")
    ping: Optional[int] = pydantic.Field(None, alias="Ping")


class CompassPropsMaster(pydantic.BaseModel):
    sso: CompassPropsMasterSSO = pydantic.Field(..., alias="SSO")
    user: CompassPropsMasterUser = pydantic.Field(..., alias="User")
    const: CompassPropsMasterConst = pydantic.Field(..., alias="Const")
    sys: CompassPropsMasterSys = pydantic.Field(..., alias="Sys")


class CompassPropsConstSys(pydantic.BaseModel):
    sto: Optional[int] = pydantic.Field(None, alias="STO")
    sto_ask: Optional[int] = pydantic.Field(None, alias="STO_ASK")


class CompassPropsConst(pydantic.BaseModel):
    sys: CompassPropsConstSys = pydantic.Field(..., alias="Sys")


class CompassProps(pydantic.BaseModel):
    nav: CompassPropsNav = pydantic.Field(..., alias="Nav")
    page: CompassPropsPage = pydantic.Field(..., alias="Page")
    crud: CompassPropsCRUD = pydantic.Field(..., alias="CRUD")
    user: CompassPropsUser = pydantic.Field(..., alias="User")
    master: CompassPropsMaster = pydantic.Field(..., alias="Master")
    const: CompassPropsConst = pydantic.Field(..., alias="Const")
