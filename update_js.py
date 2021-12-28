import asyncio
from pathlib import Path

import httpx

BASE_URL = "https://compass.scouts.org.uk/Scripts_v4.07/JS"

files = [
    "adultjoining",
    "assignnewrole",
    "Dates",
    "editprofile",
    "extenders",
    "Grids",
    "hierarchy",
    "jQuery191",
    "master",
    "memberprofile",
    "membersearch",
    "membertraining",
    "Menu",
    "neworgentity",
    "newpermit",
    "newrole",
    "newsection",
    "Popup",
    "QAS",
    "reports",
    "roles",
    "Scouts",
    "scoutsportal",
    "searchresults",
    "settings",
    "traininghours",
    "trainingogl",
    "updatetraining",
]


async def main() -> list[str]:
    async with httpx.AsyncClient() as client:
        tasks = [client.get(f"{BASE_URL}/{filename}.js") for filename in files]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
    return [resp.content for resp in responses]


if __name__ == "__main__":
    files_contents = asyncio.run(main())
    for i, filename in enumerate(files):
        Path(f"js/{filename}.js").write_bytes(files_contents[i].decode("utf-8-sig").encode("utf-8"))
