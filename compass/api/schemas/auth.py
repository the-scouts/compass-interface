from typing import Literal

from pydantic import BaseModel

from compass.core.schemas.member import MemberBase


class User(MemberBase):
    selected_role: str
    auth: list[str]


class Token(BaseModel):
    access_token: str
    token_type: Literal["bearer"]
