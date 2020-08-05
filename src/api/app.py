import uvicorn
from fastapi import FastAPI, APIRouter

from src.api.routes import members
from src.api.routes import authentication
from src.api.utility import redis_handler

open_api_tag_metadata = [
    {
        "name": "Members",
        "description": "Operations with member data. The `/me` magic ID refers to the currently authenticated user.",
    },
    {
        "name": "Authentication",
        "description": "OAuth2 **authentication** operations."
    }
]


app = FastAPI(
    title="Compass Interface — the unofficial Compass API",
    description="The ***Compass Interface*** project aims to provide a unified and well-documented API to "
                "the Scouts' national membership system, *[Compass](https://compass.scouts.org.uk)*. \n\n"
                "The project aims to: "
                "\n - increase flexibility and simplicity when developing applications that interface with *Compass* data, "
                "\n - provide  stability and abstract complexities of *Compass*, and "
                "\n - enable greater support to our adult  volunteers and "
                "members. \n\n"
                "***Compass Interface*** is [open source](https://github.com/the-scouts/compass-interface) and licensed "
                "under the **[MIT license](https://choosealicense.com/licenses/mit/)**.",
    version="0.8.7",
    on_shutdown=[redis_handler.on_shutdown],
    openapi_tags=open_api_tag_metadata,
)

version_one = APIRouter()

version_one.include_router(
    members.router,
    prefix="/members",
    tags=["Members"],
    dependencies=[],  # can't currently put auth here as we want the logon object directly...
    responses={404: {"description": "Not found!"}}
)
version_one.include_router(
    authentication.router,
    prefix="/token",
    tags=["Authentication"],
    responses={404: {"description": "Not found!"}}
)

app.include_router(
    version_one,
    prefix="/v1",
    dependencies=[]
)


@app.on_event('startup')
async def on_startup() -> None:
    await redis_handler.on_startup(app)


# Appointments report - role details (except M01Ex, M04), ongoing details (except M01Ex imputing), disclosures
# Member Directory - emergency contact details
# Permit Report - permits
# Training Report - training


# base = api.compass.cys.org.uk
# /v1/
#    /members/me
#    /members/{memberNumber}
#            /XXX/ - default is profile ✔
#                /roles ✔
#                /ongoing-training ✔
#                /disclosures
#                /training
#                /permits
#                /awards
#                /emergency_details          ??
#                /communication_preferences  ??
#                /visibility                 ??
#                /compliance_data            ??
#                /training_data              ??
#                /awards_data                ??
#    /hierarchy/
#              /organisations
#              /countries
#              /regions
#              /counties  - symlinks for Areas/Scot Region/Islands/Bailiwicks?
#              /districts
#              /groups
#              /XXX/children
#              /XXX/sections
#              /XXX/members
#    /reports/{reportType}/
#    /


if __name__ == '__main__':
    uvicorn.run("app:app", host='0.0.0.0', port=8000)
    print()


# Redis config:
# sudo apt update && sudo apt upgrade
# sudo apt-get install redis-server
# sudo systemctl enable redis-server.service
# sudo service redis-server start
# redis-cli
# config set appendonly yes
# config set appendfsync everysec
# config rewrite
