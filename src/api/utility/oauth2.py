from datetime import datetime
from datetime import timedelta
import json
import os
from typing import Optional

from aioredis import Redis
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose import JWTError

import compass as ci

from src.api.plugins.redis import depends_redis
from src.api.schemas.auth import User

SECRET_KEY = os.environ["SECRET_KEY"]  # hard fail if key not in env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/token")


def custom_bearer_auth_exception(detail: str, code: int = status.HTTP_401_UNAUTHORIZED) -> HTTPException:
    return HTTPException(
        status_code=code, detail=detail, headers={"WWW-Authenticate": "Bearer"}
    )


def authenticate_user(username: str, password: str) -> User:
    try:
        user = ci.logon(username=username, password=password)
    except ci.CompassError:
        raise PermissionError from None

    return User(
        membership_number=user.cn,
        selected_role=user.current_role,
        auth=[username, password],
    )


async def store_session(store: Redis, token: str, user: User, expiry: int):
    """

    :param store:
    :param token:
    :param user:
    :param expiry: integer number of seconds for key to live
    :return:
    """
    await store.set(f"session:{token}", json.dumps(user.dict()), expire=expiry)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None):
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"sub": subject, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), store: Redis = Depends(depends_redis)) -> ci.Logon:
    credentials_exception = custom_bearer_auth_exception("Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise credentials_exception

    user_json = await store.get(f"session:{token}")
    if user_json is None:
        raise credentials_exception

    try:
        user_dict = json.loads(user_json)
        logon = ci.Logon(user_dict.get("auth", ("", "")))
        if int(payload.get("sub")) != int(logon.cn):
            raise ci.CompassError()
    except (ci.CompassError, ValueError):
        raise credentials_exception from None

    return logon
