from __future__ import annotations

import asyncio
import base64
import os
from pathlib import Path
import time
from typing import Optional, TYPE_CHECKING

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose import JWTError
from starlette import requests

from compass.api.schemas.auth import User
from compass.api.util.http_errors import auth_error
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


def encrypt(data: bytes) -> bytes:
    nonce = os.urandom(12)  # GCM mode needs 12 fresh bytes every time
    return nonce + aes_gcm.encrypt(nonce, data, None)


async def store_kv(key: str, value: bytes, redis: Optional[Redis] = None, expire_seconds: int = 600) -> None:
    # expire param is integer number of seconds for key to live
    if redis is not None:
        await redis.set(f"session:{key}", value, expire=expire_seconds)
    SESSION_STORE.joinpath(f"{key}.bin").write_bytes(value)  # TODO async


async def create_token(username: str, pw: str, role: Optional[str], location: Optional[str], store: Redis) -> str:
    try:
        user, _ = authenticate_user(username, pw, role, location)
    except ci.errors.CompassError:
        raise auth_error("A10", "Incorrect username or password!")
    access_token_expire_minutes = 30

    jwt_expiry_time = int(time.time()) + access_token_expire_minutes * 60
    to_encode = dict(sub=f"{user.props.cn}", exp=jwt_expiry_time)
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    data = encrypt(user.json().encode())
    encoded = base64.b85encode(data)
    logger.debug(f"Created JWT for user {username}. Redis key={access_token}, data={encoded}")

    logger.debug(f"Writing {username}'s session key to redis!")
    asyncio.create_task(store_kv(access_token, data, store, expire_seconds=access_token_expire_minutes * 60))

    return access_token


def authenticate_user(username: str, password: str, role: Optional[str], location: Optional[str]) -> tuple[User, Logon]:
    logger.info(f"Logging in to Compass -- {username}")
    session = ci.login(username, password, role=role, location=location)

    logger.info(f"Successfully authenticated  -- {username}")
    user = User(
        selected_role=session.current_role,
        logon_info=(username, password, role, location),
        asp_net_id=session._asp_net_id,  # pylint: disable=protected-access
        session_id=session._session_id,  # pylint: disable=protected-access
        props=session.compass_props.master.user,
        expires=int(time.time() + 9.5 * 60),  # Compass timeout is 10m, use 9.5 here
    )
    return user, session


async def get_current_user(request: requests.Request, token: str) -> Logon:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise auth_error("A20", "Could not validate credentials")
    if not {"sub", "exp"} <= payload.keys():
        raise auth_error("A26", "Your token is malformed! Please get a new token.")
    if time.time() > payload["exp"]:
        raise auth_error("A26", "Your token has expired! Please get a new token.")

    logger.debug(f"Getting data from token:{token}")
    try:  # try fast-path
        session_decoded = SESSION_STORE.joinpath(f"{token}.bin").read_bytes()
    except (FileNotFoundError, IOError):
        store = request.app.state.redis
        session_encoded = await store.get(f"session:{token}")
        try:
            session_decoded = base64.b85decode(session_encoded)
        except ValueError:
            raise auth_error("A21", "Could not validate credentials")

    try:
        session_decrypted = aes_gcm.decrypt(session_decoded[:12], session_decoded[12:], None)
    except InvalidTag:
        raise auth_error("A22", "Could not validate credentials")

    try:
        user = User.parse_raw(session_decrypted)
        logger.debug(f"Created parsed user object {user.__dict__}")
    except KeyError:
        raise auth_error("A23", "Could not validate credentials")

    if time.time() < user.expires:
        session = Logon.from_session(user.asp_net_id, user.props.__dict__, user.session_id, user.selected_role)
    else:
        user, session = authenticate_user(*user.logon_info)
        asyncio.create_task(store_kv(token, encrypt(user.json().encode())))

    try:
        if int(payload["sub"]) == int(session.membership_number):
            return session
        raise auth_error("A24", "Could not validate credentials")  # this should be impossible
    except ValueError:
        raise auth_error("A25", "Could not validate credentials")


async def people_accessor(request: requests.Request, token: str = Depends(oauth2_scheme)) -> ci.People:
    """Returns an initialised ci.People object.

    Note `Depends` adds the oAuth2 integration with OpenAPI.
    TODO: manual integration without depends?
    """
    session = await get_current_user(request, token)
    return ci.People(session)


async def hierarchy_accessor(request: requests.Request, token: str = Depends(oauth2_scheme)) -> ci.Hierarchy:
    """Returns an initialised ci.Hierarchy object.

    Note `Depends` adds the oAuth2 integration with OpenAPI.
    TODO: manual integration without depends?
    """
    session = await get_current_user(request, token)
    return ci.Hierarchy(session)
