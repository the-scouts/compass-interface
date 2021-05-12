import fastapi
from starlette import exceptions
from starlette import requests
from starlette import status

from compass.api.schemas import auth
from compass.api.util.http_errors import http_error
from compass.api.util.oauth2 import create_token
from compass.core.logger import logger

router = fastapi.APIRouter()


@router.post("/", response_model=auth.Token)
async def login_for_access_token(request: requests.Request, form_data: auth.OAuth2Details = auth.Form(...)) -> auth.Token:
    logger.debug(f"Requested token endpoint with form data: {form_data.__dict__}")
    try:
        store = request.app.state.redis
        access_token = await create_token(form_data.username, form_data.password, form_data.role, form_data.location, store)
    except exceptions.HTTPException as err:
        raise err
    except Exception:
        raise http_error(status.HTTP_500_INTERNAL_SERVER_ERROR, "A1", "Authentication error!") from None
    return auth.Token(access_token=access_token)
