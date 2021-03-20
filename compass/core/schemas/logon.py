from __future__ import annotations

import datetime
from typing import Literal, Optional

import pydantic

TYPES_CRUD_STRING = pydantic.constr(regex=r"^[CRUD]{0,4}$")
TYPES_ORG_LEVELS = Literal["ORG", "ORST", "CNTR", "CNST", "REG", "RGST", "CNTY", "CTST", "DIST", "DTST", "SGRP", "SGST"]


class CompassPropsBase(pydantic.BaseModel):
    class Config:  # noqa: D106 (missing docstring)
        allow_population_by_field_name = True
        extra = "allow"


class CompassPropsNav(CompassPropsBase):
    action: Optional[Literal["None"]] = pydantic.Field(None, alias="Action")
    start_no: Optional[int] = pydantic.Field(None, alias="StartNo")
    start_page: Optional[int] = pydantic.Field(None, alias="StartPage")


class CompassPropsPage(CompassPropsBase):
    use_cn: Optional[int] = pydantic.Field(None, alias="UseCN")
    hide_badges: Optional[bool] = pydantic.Field(None, alias="HideBadges")
    croc: Optional[Literal["OK"]] = pydantic.Field(None, alias="Croc")
    hide_nominations: Optional[bool] = pydantic.Field(None, alias="HideNominations")
    can_delete_ogl_hrs: Optional[bool] = pydantic.Field(None, alias="CanDeleteOGLHrs")
    fold_name: Optional[Literal["MP_"]] = pydantic.Field(None, alias="FoldName")


class CompassPropsCRUD(CompassPropsBase):
    mdis: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="MDIS")  # type: ignore[valid-type]
    roles: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="ROLES")  # type: ignore[valid-type]
    pemd: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="PEMD")  # type: ignore[valid-type]
    mmmd: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="MMMD")  # type: ignore[valid-type]
    mvid: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="MVID")  # type: ignore[valid-type]
    perm: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="PERM")  # type: ignore[valid-type]
    trn: Optional[TYPES_CRUD_STRING] = pydantic.Field(None, alias="TRN")  # type: ignore[valid-type]


class CompassPropsUser(CompassPropsBase):
    is_me: Optional[bool] = pydantic.Field(None, alias="IsMe")


class CompassPropsMasterSSO(CompassPropsBase):
    on: Optional[int] = pydantic.Field(None, alias="ON")


class CompassPropsMasterUser(CompassPropsBase):
    cn: Optional[int] = pydantic.Field(None, alias="CN")
    mrn: Optional[int] = pydantic.Field(None, alias="MRN")
    on: Optional[int] = pydantic.Field(None, alias="ON")
    lvl: Optional[TYPES_ORG_LEVELS] = pydantic.Field(None, alias="LVL")
    jk: Optional[str] = pydantic.Field(None, alias="JK")


class CompassPropsMasterConst(CompassPropsBase):
    wales: Optional[int] = pydantic.Field(None, alias="Wales")
    scotland: Optional[int] = pydantic.Field(None, alias="Scotland")
    over_seas: Optional[int] = pydantic.Field(None, alias="OverSeas")
    hq: Optional[int] = pydantic.Field(None, alias="HQ")


class CompassPropsMasterSys(CompassPropsBase):
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


class CompassPropsMaster(CompassPropsBase):
    sso: CompassPropsMasterSSO = pydantic.Field(CompassPropsMasterSSO(), alias="SSO")
    user: CompassPropsMasterUser = pydantic.Field(CompassPropsMasterUser(), alias="User")
    const: CompassPropsMasterConst = pydantic.Field(CompassPropsMasterConst(), alias="Const")
    sys: CompassPropsMasterSys = pydantic.Field(CompassPropsMasterSys(), alias="Sys")


class CompassPropsConstSys(CompassPropsBase):
    sto: Optional[int] = pydantic.Field(None, alias="STO")
    sto_ask: Optional[int] = pydantic.Field(None, alias="STO_ASK")


class CompassPropsConst(CompassPropsBase):
    sys: CompassPropsConstSys = pydantic.Field(CompassPropsConstSys(), alias="Sys")


class CompassProps(CompassPropsBase):
    nav: CompassPropsNav = pydantic.Field(CompassPropsNav(), alias="Nav")
    page: CompassPropsPage = pydantic.Field(CompassPropsPage(), alias="Page")
    crud: CompassPropsCRUD = pydantic.Field(CompassPropsCRUD(), alias="CRUD")
    user: CompassPropsUser = pydantic.Field(CompassPropsUser(), alias="User")
    master: CompassPropsMaster = pydantic.Field(CompassPropsMaster(), alias="Master")
    const: CompassPropsConst = pydantic.Field(CompassPropsConst(), alias="Const")
