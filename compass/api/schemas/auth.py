from typing import Literal, Optional

import pydantic

from compass.core.schemas.member import MemberBase


class User(MemberBase):
    selected_role: tuple[str, str]
    logon_info: tuple[str, str, Optional[str], Optional[str]]


class Token(pydantic.BaseModel):
    access_token: str
    token_type: Literal["bearer"]
