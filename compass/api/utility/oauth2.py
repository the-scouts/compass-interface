import base64
import datetime
import os
from typing import Optional

from aioredis import Redis
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose import JWTError
from starlette import status

from compass.api.plugins.redis import depends_redis
from compass.api.schemas.auth import User
import compass.core as ci
from compass.core.logger import logger
from compass.core.logon import Logon

SECRET_KEY = os.environ["SECRET_KEY"]  # hard fail if key not in env
aes_gcm = AESGCM(bytes.fromhex(SECRET_KEY))
ALGORITHM = "HS256"


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/token")


def custom_bearer_auth_exception(detail: str, code: int = status.HTTP_401_UNAUTHORIZED) -> HTTPException:
    return HTTPException(status_code=code, detail=detail, headers={"WWW-Authenticate": "Bearer"})


async def login_token_store_session(user: str, pw: str, role: Optional[str], location: Optional[str], store: Redis) -> str:
    try:
        user = authenticate_user(user, pw, role, location)
    except ci.errors.CompassError:
        raise custom_bearer_auth_exception("Incorrect username or password") from None
    access_token_expire_minutes = 30

    jwt_expiry_time = datetime.datetime.utcnow() + datetime.timedelta(minutes=access_token_expire_minutes)
    to_encode = dict(sub=f"{user.props.cn}", exp=jwt_expiry_time)
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    nonce = os.urandom(12)  # GCM mode needs 12 fresh bytes every time
    data = base64.b85encode(nonce + aes_gcm.encrypt(nonce, user.json().encode(), None))
    logger.debug(f"Created JWT for user {user}. Redis key={access_token}, data={data}")

    # expire param is integer number of seconds for key to live
    logger.debug(f"Writing {user}'s session key to redis!")
    await store.set(f"session:{access_token}", data, expire=access_token_expire_minutes * 60)

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
        expires=datetime.datetime.utcnow() + datetime.timedelta(minutes=9.5),  # Compass timeout is 10m, use 9.5 here
    )


async def get_current_user(token: str = Depends(oauth2_scheme), store: Redis = Depends(depends_redis)) -> Logon:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise custom_bearer_auth_exception("Could not validate credentials") from None

    logger.debug(f"Getting data from token:{token}")
    session_encoded = await store.get(f"session:{token}")
    try:
        session_decoded = base64.b85decode(session_encoded)  # Maybe raises ValueError
        session_decrypted = aes_gcm.decrypt(session_decoded[:12], session_decoded[12:], None)  # Maybe raises InvalidTag
        user = User.parse_raw(session_decrypted)  # Maybe raises KeyError
        logger.debug(f"Created parsed user object {user.__dict__}")
        if datetime.datetime.utcnow() < user.expires:
            logon = Logon.from_session(user.asp_net_id, user.props.__dict__, user.selected_role)
        else:
            logon = Logon.from_logon(user.logon_info[:2], *user.logon_info[2:])
        if int(payload.get("sub", -1)) == int(logon.membership_number):  # Maybe raises ValueError
            return logon
    except (InvalidTag, KeyError, ValueError):
        raise custom_bearer_auth_exception("Could not validate credentials") from None


async def people_accessor(token: str = Depends(oauth2_scheme), store: Redis = Depends(depends_redis)) -> ci.People:
    session = await get_current_user(token, store)
    return ci.People(session)
