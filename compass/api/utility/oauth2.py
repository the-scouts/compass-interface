from __future__ import annotations

import asyncio
import base64
import os
from pathlib import Path
import time
from typing import NoReturn, Optional, TYPE_CHECKING

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose import JWTError
from starlette import requests
from starlette import status

from compass.api.utility.redis import get_redis
from compass.api.schemas.auth import User
import compass.core as ci
from compass.core.logger import logger
from compass.core.logon import Logon

if TYPE_CHECKING:
    from aioredis import Redis

SECRET_KEY = os.environ["SECRET_KEY"]  # hard fail if key not in env
aes_gcm = AESGCM(bytes.fromhex(SECRET_KEY))
ALGORITHM = "HS256"
SESSION_STORE = Path(os.getenv("CI_SESSION_STORE", "sessions/")).resolve()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/token/")


def raise_auth_error(detail: str, code: int = status.HTTP_401_UNAUTHORIZED) -> NoReturn:
    raise HTTPException(status_code=code, detail=detail, headers={"WWW-Authenticate": "Bearer"}) from None


async def create_token(username: str, pw: str, role: Optional[str], location: Optional[str], store: Redis) -> str:
    try:
        user = authenticate_user(username, pw, role, location)
    except ci.errors.CompassError:
        raise raise_auth_error("Incorrect username or password! [Error: A10]")
    access_token_expire_minutes = 30

    jwt_expiry_time = int(time.time()) + access_token_expire_minutes * 60
    to_encode = dict(sub=f"{user.props.cn}", exp=jwt_expiry_time)
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    nonce = os.urandom(12)  # GCM mode needs 12 fresh bytes every time
    data = nonce + aes_gcm.encrypt(nonce, user.json().encode(), None)
    encoded = base64.b85encode(data)
    logger.debug(f"Created JWT for user {username}. Redis key={access_token}, data={encoded}")

    logger.debug(f"Writing {username}'s session key to redis!")

    # expire param is integer number of seconds for key to live
    asyncio.create_task(store.set(f"session:{access_token}", encoded, expire=access_token_expire_minutes * 60))
    SESSION_STORE.joinpath(f"{access_token}.bin").write_bytes(data)  # TODO async

    return access_token


def authenticate_user(username: str, password: str, role: Optional[str], location: Optional[str]) -> User:
    logger.info(f"Logging in to Compass -- {username}")
    user = ci.login(username, password, role=role, location=location)

    logger.info(f"Successfully authenticated  -- {username}")
    return User(
        selected_role=user.current_role,
        logon_info=(username, password, role, location),
        asp_net_id=user._asp_net_id,  # pylint: disable=protected-access
        props=user.compass_props.master.user,
        expires=int(time.time() + 9.5 * 60),  # Compass timeout is 10m, use 9.5 here
    )


async def get_current_user(request: requests.Request, token: str) -> Logon:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise raise_auth_error("Could not validate credentials [Error: A20]")

    logger.debug(f"Getting data from token:{token}")
    try:  # try fast-path
        session_decoded = SESSION_STORE.joinpath(f"{token}.bin").read_bytes()
    except (FileNotFoundError, IOError):
        store = await get_redis(request)
        session_encoded = await store.get(f"session:{token}")
        try:
            session_decoded = base64.b85decode(session_encoded)
        except ValueError:
            raise raise_auth_error("Could not validate credentials [Error: A21]")

    try:
        session_decrypted = aes_gcm.decrypt(session_decoded[:12], session_decoded[12:], None)
    except InvalidTag:
        raise raise_auth_error("Could not validate credentials [Error: A22]")

    try:
        user = User.parse_raw(session_decrypted)
        logger.debug(f"Created parsed user object {user.__dict__}")
    except KeyError:
        raise raise_auth_error("Could not validate credentials [Error: A23]")

    if time.time() < user.expires:
        session = Logon.from_session(user.asp_net_id, user.props.__dict__, user.selected_role)
    else:
        session = Logon.from_logon(user.logon_info[:2], *user.logon_info[2:])

    try:
        if int(payload.get("sub", -1)) == int(session.membership_number):
            return session
        raise raise_auth_error("Could not validate credentials [Error: A24]")  # this should be impossible
    except ValueError:
        raise raise_auth_error("Could not validate credentials [Error: A25]")


async def people_accessor(request: requests.Request, token: str = Depends(oauth2_scheme)) -> ci.People:
    """Returns an initialised ci.People object.

    Note `Depends` adds the oAuth2 integration with OpenAPI.
    TODO: manual integration without depends?
    """
    session = await get_current_user(request, token)
    return ci.People(session)
