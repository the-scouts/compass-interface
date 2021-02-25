import datetime
import os
import binascii
from typing import Optional

from aioredis import Redis
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose import JWTError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
from starlette import status

import compass.core as ci
from compass.api.plugins.redis import depends_redis
from compass.api.schemas.auth import User

SECRET_KEY = os.environ["SECRET_KEY"]  # hard fail if key not in env
aes_gcm = AESGCM(binascii.unhexlify(SECRET_KEY))  # hard fail if key not in env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/token")


def custom_bearer_auth_exception(detail: str, code: int = status.HTTP_401_UNAUTHORIZED) -> HTTPException:
    return HTTPException(status_code=code, detail=detail, headers={"WWW-Authenticate": "Bearer"})


async def login_token_store_session(user: str, pw: str, role: Optional[str], location: Optional[str], store: Redis) -> str:
    try:
        user = authenticate_user(user, pw, role, location)
    except ci.errors.CompassError:
        raise custom_bearer_auth_exception("Incorrect username or password") from None

    to_encode = dict(sub=f"{user.membership_number}", exp=datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    nonce = os.urandom(12)  # GCM mode needs 12 fresh bytes every time
    data = nonce + aes_gcm.encrypt(nonce, user.json().encode(), None)
    # expire param is integer number of seconds for key to live
    await store.set(f"session:{access_token}", data, expire=ACCESS_TOKEN_EXPIRE_MINUTES * 60)

    return access_token


def authenticate_user(username: str, password: str, role: Optional[str], location: Optional[str]) -> User:
    user = ci.login(username, password, role=role, location=location)

    return User(
        membership_number=user.cn,
        selected_role=user.current_role,
        logon_info=(username, password, role, location),
    )


async def get_current_user(token: str = Depends(oauth2_scheme), store: Redis = Depends(depends_redis)) -> ci.Logon:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise custom_bearer_auth_exception("Could not validate credentials")

    session_encoded = await store.get(f"session:{token}")
    try:
        session_decrypted = aes_gcm.decrypt(session_encoded[:12], session_encoded[12:], None)  # Maybe raises InvalidTag
        logon_info = User.parse_raw(session_decrypted).logon_info  # Maybe raises KeyError
        logon = ci.Logon(logon_info[:2], *logon_info[2:])
        if int(payload.get("sub", -1)) == int(logon.cn):  # Maybe raises ValueError
            return logon
    except (InvalidTag, KeyError, ValueError):
        raise custom_bearer_auth_exception("Could not validate credentials") from None
