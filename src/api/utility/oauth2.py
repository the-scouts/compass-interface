import json
from datetime import datetime, timedelta
from typing import Optional

from aioredis import Redis
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from src.api.plugins.redis import depends_redis
from src.api.schemas.auth import User
from src.compass.errors import CompassError
from src.compass.logon import CompassLogon

# to get a string like this run:
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # openssl rand -hex 32
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/token")


def custom_bearer_auth_exception(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, headers={"WWW-Authenticate": "Bearer"}
    )


def authenticate_user(username: str, password: str) -> User:
    try:
        user = CompassLogon([username, password])
    except CompassError:
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


async def get_current_user(token: str = Depends(oauth2_scheme), store: Redis = Depends(depends_redis)) -> CompassLogon:
    credentials_exception = custom_bearer_auth_exception("Could not validate credentials")
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise credentials_exception

    user_json = await store.get(f"session:{token}")
    if user_json is None:
        raise credentials_exception

    try:
        user_dict = json.loads(user_json)
        logon = CompassLogon(user_dict.get("auth", ["", ""]))
    except CompassError:
        raise credentials_exception from None

    return logon
