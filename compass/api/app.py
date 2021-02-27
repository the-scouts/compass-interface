from fastapi import APIRouter
from fastapi import FastAPI
import uvicorn

from compass.api.routes import authentication
from compass.api.routes import members
from compass.api.plugins import redis

open_api_tag_metadata = [
    {
        "name": "Members",
        "description": "Operations with member data. The `/me` magic ID refers to the currently authenticated user.",
    },
    {
        "name": "Authentication",
        "description": "OAuth2 **authentication** operations.",
    },
]

long_description = """
The ***Compass Interface*** project aims to provide a unified and well-documented API to 
the Scouts' national membership system, *[Compass](https://compass.scouts.org.uk)*. 

The project aims to: 
 - increase flexibility and simplicity when developing applications that interface with *Compass* data, 
 - provide  stability and abstract complexities of *Compass*, and 
 - enable greater support to our adult  volunteers and 
members. 

***Compass Interface*** is naturally [open source](https://github.com/the-scouts/compass-interface) 
and is licensed under the **[MIT license](https://choosealicense.com/licenses/mit/)**.
"""

app = FastAPI(
    title="Compass Interface — the unofficial Compass API",
    description=long_description,
    version="0.22.3",
    on_startup=[redis.on_startup],
    on_shutdown=[redis.on_shutdown],
    openapi_tags=open_api_tag_metadata,
)

# V1 Routing
version_one = APIRouter()
version_one.include_router(
    members.router,
    prefix="/members",
    tags=["Members"],
    dependencies=[],  # can't currently put auth here as we want the logon object directly...
    responses={404: {"description": "Not found!"}},
)
version_one.include_router(
    authentication.router,
    prefix="/token",
    tags=["Authentication"],
    responses={404: {"description": "Not found!"}},
)

# Overall app routing
app.include_router(
    version_one,
    prefix="/v1",
    dependencies=[],
)

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


if __name__ == "__main__":
    from compass.core.logger import enable_debug_logging

    enable_debug_logging()
    uvicorn.run("app:app", host="0.0.0.0", port=8002)
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
