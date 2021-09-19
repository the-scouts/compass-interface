import fastapi
from starlette import exceptions

from compass.api.schemas import auth
from compass.api.util import http_errors
from compass.api.util.oauth2 import create_token
from compass.core.logger import logger

router = fastapi.APIRouter()


@router.post("/", response_model=auth.Token)
async def login_for_access_token(form_data: auth.OAuth2Details = auth.Form(...)) -> auth.Token:
    logger.debug(f"Requested token endpoint with form data: {form_data.__dict__}")
    try:
        access_token = await create_token(form_data.username, form_data.password, form_data.role, form_data.location)
    except exceptions.HTTPException as err:
        raise err
    except Exception:
        raise http_errors.A1 from None
    return auth.Token(access_token=access_token)
