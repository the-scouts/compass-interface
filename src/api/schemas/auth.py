from typing import List

from pydantic import BaseModel

from compass.schemas.member import MemberBase


class User(MemberBase):
    selected_role: str
    auth: List[str]


class Token(BaseModel):
    access_token: str
    token_type: str
