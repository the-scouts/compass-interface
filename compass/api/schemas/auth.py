from typing import Literal, Optional

from fastapi import params
import pydantic

from compass.core.schemas.logon import CompassPropsMasterUser


class OAuth2Details(pydantic.BaseModel):
    grant_type: Literal["password"] = "password"
    username: str
    password: str
    scope: str = ""  # e.g. "items:read items:write users:read profile openid"
    # not part of OAuth2 spec:
    role: Optional[str]
    location: Optional[str]


class Form(params.Form):
    def __init__(self, default, **kwargs):
        super().__init__(default, **kwargs)
        self.embed = False


class User(pydantic.BaseModel):
    selected_role: tuple[str, str]
    logon_info: tuple[str, str, Optional[str], Optional[str]]
    asp_net_id: str
    session_id: str
    props: CompassPropsMasterUser
    expires: int


class Token(pydantic.BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
