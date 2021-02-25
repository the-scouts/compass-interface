from aioredis import Redis
from fastapi import APIRouter
from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm

from compass.api.plugins.redis import depends_redis
from compass.api.schemas.auth import Token
from compass.api.utility.oauth2 import login_token_store_session

router = APIRouter()


@router.post("/", response_model=Token)
async def login_for_access_token(store: Redis = Depends(depends_redis), form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    access_token = await login_token_store_session(form_data.username, form_data.password, None, None, store=store)
    return Token(access_token=access_token, token_type="bearer")
