from aioredis import Redis
import fastapi
from fastapi import HTTPException
from starlette import status

from compass.api.utility.redis import get_redis
from compass.api.schemas import auth
from compass.api.utility.oauth2 import create_token
from compass.core.logger import logger

router = fastapi.APIRouter()


@router.post("/", response_model=auth.Token)
async def login_for_access_token(store: Redis = fastapi.Depends(get_redis), form_data: auth.OAuth2Details = auth.Form(...)) -> auth.Token:
    logger.debug(f"Requested token endpoint with form data: {form_data.__dict__}")
    try:
        access_token = await create_token(form_data.username, form_data.password, form_data.role, form_data.location, store)
    except HTTPException as err:
        raise err
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication error!") from None
    return auth.Token(access_token=access_token)
