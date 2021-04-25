from aioredis import Redis
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from starlette import status

from compass.api.plugins.redis import depends_redis
from compass.api.schemas.auth import Token
from compass.api.utility.oauth2 import login_token_store_session
from compass.core.logger import logger

router = APIRouter()


@router.post("/", response_model=Token)
async def login_for_access_token(store: Redis = Depends(depends_redis), form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    logger.debug(f"Requested token endpoint with form data: {form_data.__dict__}")
    try:
        access_token = await login_token_store_session(form_data.username, form_data.password, None, None, store=store)
    except Exception as err:
        if isinstance(err, HTTPException):
            raise err
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication error!") from None
    return Token(access_token=access_token, token_type="bearer")
