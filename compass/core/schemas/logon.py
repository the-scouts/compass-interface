from __future__ import annotations

import datetime
from typing import Literal, Optional

import pydantic


class CompassPropsNav(pydantic.BaseModel):
    Action: Optional[Literal["None"]] = None
    StartNo: Optional[int] = None
    StartPage: Optional[int] = None


class CompassPropsPage(pydantic.BaseModel):
    UseCN: int
    HideBadges: Optional[bool] = None
    Croc: Optional[Literal["OK"]] = None
    HideNominations: Optional[bool] = None
    CanDeleteOGLHrs: Optional[bool] = None
    FoldName: Optional[Literal["MP_"]] = None


class CompassPropsCRUD(pydantic.BaseModel):
    MDIS: Optional[str] = None
    ROLES: Optional[str] = None
    PEMD: Optional[str] = None
    MMMD: Optional[str] = None
    MVID: Optional[str] = None
    PERM: Optional[str] = None
    TRN: Optional[pydantic.constr(regex=r"^[CRUD]{0,4}$")] = None


class CompassPropsUser(pydantic.BaseModel):
    IsMe: Optional[bool] = None


class CompassPropsMasterSSO(pydantic.BaseModel):
    ON: Optional[int] = None


class CompassPropsMasterUser(pydantic.BaseModel):
    CN: Optional[int] = None
    MRN: Optional[int] = None
    ON: Optional[int] = None
    LVL: Optional[Literal["ORG", "ORST", "CNTR", "CNST", "REG", "RGST", "CNTY", "CTST", "DIST", "DTST", "SGRP", "SGST"]] = None
    JK: Optional[str] = None  # SHA2-512


class CompassPropsMasterConst(pydantic.BaseModel):
    Wales: Optional[int] = 10000007
    Scotland: Optional[int] = 10000005
    OverSeas: Optional[int] = 10000002
    HQ: Optional[int] = 10000001


class CompassPropsMasterSys(pydantic.BaseModel):
    SessionID: Optional[str] = None
    SafeJSON: Optional[bool] = None
    WebPath: Optional[pydantic.HttpUrl] = None
    TextSize: Optional[int] = None
    Timout: Optional[int] = None
    REST: Optional[bool] = None
    HardTime: Optional[datetime.time] = None
    HardExpiry: Optional[str] = None
    TimeoutExtension: Optional[int] = None
    Ping: Optional[int] = None


class CompassPropsMaster(pydantic.BaseModel):
    SSO: CompassPropsMasterSSO
    User: CompassPropsMasterUser
    Const: CompassPropsMasterConst
    Sys: CompassPropsMasterSys


class CompassPropsConstSys(pydantic.BaseModel):
    STO: Optional[int] = None
    STO_ASK: Optional[int] = None


class CompassPropsConst(pydantic.BaseModel):
    Sys: CompassPropsConstSys


class CompassProps(pydantic.BaseModel):
    Nav: CompassPropsNav
    Page: CompassPropsPage
    CRUD: CompassPropsCRUD
    User: CompassPropsUser
    Master: CompassPropsMaster
    Const: CompassPropsConst
