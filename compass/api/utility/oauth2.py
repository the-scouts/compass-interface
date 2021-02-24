import datetime
import json
import os

from aioredis import Redis
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose import JWTError
from starlette import status

import compass as ci
from compass.api.plugins.redis import depends_redis
from compass.api.schemas.auth import User

SECRET_KEY = os.environ["SECRET_KEY"]  # hard fail if key not in env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/token")


def custom_bearer_auth_exception(detail: str, code: int = status.HTTP_401_UNAUTHORIZED) -> HTTPException:
    return HTTPException(status_code=code, detail=detail, headers={"WWW-Authenticate": "Bearer"})


def authenticate_user(username: str, password: str, role: str, location: str) -> User:
    try:
        user = ci.login(username, password, role=role, location=location)
    except ci.errors.CompassError:
        raise PermissionError from None

    return User(
        membership_number=user.cn,
        selected_role=user.current_role,
        logon_info=(username, password, role, location),
    )


async def store_session(store: Redis, token: str, user: User, expiry: int) -> None:
    """

    Args:
        store:
        token:
        user:
        expiry: integer number of seconds for key to live
    """
    await store.set(f"session:{token}", json.dumps(user.__dict__), expire=expiry)


def create_access_token(subject: str, expires_delta: datetime.timedelta = datetime.timedelta(minutes=15)) -> str:
    to_encode = dict(sub=subject, exp=datetime.datetime.utcnow() + expires_delta)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme), store: Redis = Depends(depends_redis)) -> ci.Logon:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise custom_bearer_auth_exception("Could not validate credentials")

    user_json = await store.get(f"session:{token}") or "{}"  # "{}" is shortest valid JSON dict
    try:
        logon_info = json.loads(user_json)["logon_info"]  # Maybe raises KeyError
        logon = ci.Logon(logon_info[:2], *logon_info[2:])
        if int(payload.get("sub", -1)) == int(logon.cn):  # Maybe raises ValueError
            return logon
    except (KeyError, ValueError):
        raise custom_bearer_auth_exception("Could not validate credentials") from None
