from typing import Literal

import pydantic

from compass.core.schemas.member import MemberBase


class User(MemberBase):
    selected_role: tuple[str, str]
    logon_info: tuple[str, str, str, str]


class Token(pydantic.BaseModel):
    access_token: str
    token_type: Literal["bearer"]
