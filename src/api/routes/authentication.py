from datetime import timedelta

from aioredis import Redis
from fastapi import Depends, APIRouter
from fastapi.security import OAuth2PasswordRequestForm

from src.api.plugins.redis import depends_redis
from src.api.schemas.auth import Token
from src.api.utility.oauth2 import authenticate_user, custom_bearer_auth_exception, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, store_session

router = APIRouter()


@router.post("/", response_model=Token)
async def login_for_access_token(store: Redis = Depends(depends_redis), form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = authenticate_user(form_data.username, form_data.password)
    except PermissionError:
        raise custom_bearer_auth_exception("Incorrect username or password") from None

    access_token = create_access_token(f"{user.membership_number}", timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    await store_session(store, access_token, user, ACCESS_TOKEN_EXPIRE_MINUTES*60)

    return {"access_token": access_token, "token_type": "bearer"}
