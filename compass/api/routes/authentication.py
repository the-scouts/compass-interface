from datetime import timedelta

from aioredis import Redis
from api.plugins.redis import depends_redis
from api.schemas.auth import Token
from api.utility.oauth2 import ACCESS_TOKEN_EXPIRE_MINUTES
from api.utility.oauth2 import authenticate_user
from api.utility.oauth2 import create_access_token
from api.utility.oauth2 import custom_bearer_auth_exception
from api.utility.oauth2 import store_session
from fastapi import APIRouter
from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()


@router.post("/", response_model=Token)
async def login_for_access_token(store: Redis = Depends(depends_redis), form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = authenticate_user(form_data.username, form_data.password)
    except PermissionError:
        raise custom_bearer_auth_exception("Incorrect username or password") from None

    access_token = create_access_token(f"{user.membership_number}", timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    await store_session(store, access_token, user, ACCESS_TOKEN_EXPIRE_MINUTES * 60)

    return {"access_token": access_token, "token_type": "bearer"}
