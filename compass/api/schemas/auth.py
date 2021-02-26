import datetime
from typing import Literal, Optional

import pydantic

from compass.core.schemas.logon import CompassPropsMasterUser


class User(pydantic.BaseModel):
    selected_role: tuple[str, str]
    logon_info: tuple[str, str, Optional[str], Optional[str]]
    asp_net_id: str
    props: CompassPropsMasterUser
    expires: datetime.datetime


class Token(pydantic.BaseModel):
    access_token: str
    token_type: Literal["bearer"]
