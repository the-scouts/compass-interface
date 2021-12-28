from __future__ import annotations

import asyncio
import base64
import os
from pathlib import Path
import time
from typing import Optional

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose import JWTError

from compass.api.schemas.auth import User
from compass.api.util import http_errors
import compass.core as ci
from compass.core.logger import logger

SECRET_KEY = os.environ["SECRET_KEY"]  # hard fail if key not in env
aes_gcm = AESGCM(bytes.fromhex(SECRET_KEY))
ALGORITHM = "HS256"
SESSION_STORE = Path(os.getenv("CI_SESSION_STORE", "sessions/")).resolve()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/token/")


async def encrypt(data: bytes) -> bytes:
    nonce = os.urandom(12)  # GCM mode needs 12 fresh bytes every time
    return nonce + aes_gcm.encrypt(nonce, data, None)


async def persist_session(key: str, value: bytes) -> None:
    SESSION_STORE.joinpath(f"{key}.bin").write_bytes(value)  # TODO async


async def create_token(username: str, pw: str, role: Optional[str], location: Optional[str]) -> str:
    try:
        user, _ = await authenticate_user(username, pw, role, location)
    except ci.errors.CompassError:
        raise http_errors.A10

    to_encode = dict(sub=f"{user.props.cn}", exp=int(time.time()) + 3600)
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    data = await encrypt(user.json().encode())
    encoded = base64.b85encode(data)
    logger.debug(f"Created JWT for user {username}. key={access_token}, data={encoded}")

    logger.debug(f"Persisting {username}'s session key!")
    asyncio.create_task(persist_session(access_token, data))

    return access_token


async def authenticate_user(username: str, password: str, role: Optional[str], location: Optional[str]) -> tuple[User, ci.CompassInterface]:
    logger.info(f"Logging in to Compass -- {username}")
    api = ci.login(username, password, role=role, location=location)

    logger.info(f"Successfully authenticated -- {username}")
    user = User(
        selected_role=api.user.current_role,
        logon_info=(username, password, role, location),
        asp_net_id=api.user._asp_net_id,  # pylint: disable=protected-access
        session_id=api.user._session_id,  # pylint: disable=protected-access
        props=api.user.compass_props.master.user,
        expires=int(time.time() + 9.5 * 60),  # Compass timeout is 10m, use 9.5 here
    )
    return user, api


def retrieve_token_data(token: str) -> bytes:
    return SESSION_STORE.joinpath(f"{token}.bin").read_bytes()


async def get_current_user(token: str) -> ci.CompassInterface:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise http_errors.A20
    if not {"sub", "exp"} <= payload.keys():
        raise http_errors.A26
    if time.time() > payload["exp"]:
        raise http_errors.A26

    logger.debug(f"Getting data from token:{token}")
    try:
        session_decoded = retrieve_token_data(token)
    except (FileNotFoundError, IOError):
        raise http_errors.A21

    try:
        session_decrypted = aes_gcm.decrypt(session_decoded[:12], session_decoded[12:], None)
    except InvalidTag:
        raise http_errors.A22

    try:
        user = User.parse_raw(session_decrypted)
        logger.debug(f"Created parsed user object {user.__dict__}")
    except KeyError:
        raise http_errors.A23

    if time.time() < user.expires:
        api = ci.CompassInterface(ci.Logon.from_session(user.asp_net_id, user.props.__dict__, user.session_id, user.selected_role))
    else:
        user, api = await authenticate_user(*user.logon_info)
        asyncio.create_task(persist_session(token, await encrypt(user.json().encode())))

    try:
        if int(payload["sub"]) == int(api.user.membership_number):
            return api
        raise http_errors.A24  # this should be impossible
    except ValueError:
        raise http_errors.A25


async def ci_user(token: str = Depends(oauth2_scheme)) -> ci.CompassInterface:
    """Returns an initialised ci.CompassInterface object.

    Note `Depends` adds the oAuth2 integration with OpenAPI.
    TODO: manual integration without depends?
    """
    return await get_current_user(token)
