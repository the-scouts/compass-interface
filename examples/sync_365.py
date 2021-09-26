"""Draft implementation of Compass -> Office 365 synchronisation."""

from __future__ import annotations

import datetime
import re
import secrets
import string
import time
from typing import Any, TYPE_CHECKING

import click
import httpx
import msal
import tomli

import compass.core as ci

if TYPE_CHECKING:
    from collections.abc import Set
    from io import TextIOWrapper

# ## ### LIBRARY SECTION ### ## #

# Globals
token_requested_time: float = 0
MEMBERS: dict[int, dict[str, Any]] = {}

# Constants
PWD_CHARS = string.ascii_letters + string.digits
WHITELISTED = re.compile("[^a-zA-Z-]+")
GRAPH_URL = "https://graph.microsoft.com/v1.0"
GRAPH_SCOPE = ["https://graph.microsoft.com/.default"]


def _get_member_ids() -> Set[int]:
    return MEMBERS.keys()


def _get_member_details(member_num: int) -> dict[str, Any]:
    return MEMBERS[member_num]


def _update_member_details(member_num: int, details: dict[str, Any]) -> None:
    try:
        MEMBERS[member_num] |= details
    # if member_num not in database, create entry with details dict
    except KeyError:
        MEMBERS[member_num] = details


def sync_compass_o365(
    api: ci.CompassInterface,
    domain: str,
    organisation_name: str,
    graph_auth: tuple[str, str, str],
    session: httpx.Client
) -> None:
    # Fetch summary member report from Compass.
    member_ids_compass = api.hierarchy.unique_members(use_default=True)
    member_ids_local = _get_member_ids()

    # Gone Members - in database but missing from Compass
    old_member_ids = member_ids_local - member_ids_compass
    # New members - in Compass but missing from database
    new_member_ids = member_ids_compass - member_ids_local

    for member_num in old_member_ids:
        _update_member_details(member_num, {"in_compass": False, "last_update": datetime.date.today()})

    for member_num in new_member_ids:
        _add_member_details(api, member_num)

        _add_member_to_o365(member_num, domain, organisation_name, graph_auth, session)

    for member_num in member_ids_local:
        member_details = _get_member_details(member_num)
        if member_details["in_compass"] is False:
            print(f"Member {member_num} marked missing on {member_details['last_update']}")


def _add_member_details(api: ci.CompassInterface, member_num: int) -> None:
    personal_details = api.people.personal(member_num)
    roles_details = api.people.roles(member_num)

    _update_member_details(
        member_num,
        {
            "_id": member_num,
            "in_compass": True,
            "last_update": datetime.date.today(),
            "forenames": personal_details.forenames,
            "surname": personal_details.surname,
            # "full_name": personal_details.name,
            "known_as": personal_details.known_as,
            "display_name": f"{personal_details.known_as} {personal_details.surname}",
            # "address": personal_details.address,
            # "main_phone": personal_details.main_phone,
            "main_email": personal_details.main_email,
            # "join_date": personal_details.join_date,
            # "sex": personal_details.sex,
            "primary_role": roles_details.roles[roles_details.primary_role].role_title,
            # "primary_role_id": roles.primary_role,
            "primary_role_location": roles_details.roles[roles_details.primary_role].location_name,
            # "roles": roles.roles,
        }
    )


def _setup_session(graph_app_id: str, graph_authority: str, graph_app_secret: str, session: httpx.Client) -> None:
    global token_requested_time

    # Check the time since the header was last set, if older than 55 mins, reset the header to request a new token
    if time.time() - token_requested_time < (60 * 55):
        return
    print("Token expired - resetting")

    # acquire token
    app = msal.ConfidentialClientApplication(graph_app_id, authority=graph_authority, client_credential=graph_app_secret)
    token = app.acquire_token_silent(GRAPH_SCOPE, account=None)
    if not token:
        token = app.acquire_token_for_client(scopes=GRAPH_SCOPE)
        if not token or "error" in token:
            raise RuntimeError("Failed to get token from Azure AD")

    # Update headers and set update time
    session.headers.update({"Authorization": f"Bearer {token['access_token']}"})
    token_requested_time = time.time()


def _add_member_to_o365(
    membership_id: int,
    domain: str,
    organisation_name: str,
    graph_auth: tuple[str, str, str],
    session: httpx.Client
) -> None:
    """Creates a new user on Office 365."""
    # Lookup the member from Compass
    try:
        member_obj = _get_member_details(membership_id)
    except KeyError:
        return None

    # Check an account hasn't already been created
    if "o365_profile" in member_obj:
        return None

    # Create the email address - keep only letters and hyphens
    firstname = WHITELISTED.sub("", member_obj["known_as"])
    surname = WHITELISTED.sub("", member_obj["surname"])
    email_nickname = f"{firstname}.{surname}".lower()
    user_principal_name = f"{email_nickname}@{domain}"

    # Generate a temp password
    tmp_password = "".join(secrets.choice(PWD_CHARS) for _ in range(20))

    create_obj = {
        # required
        "accountEnabled": True,
        "displayName": member_obj["display_name"],
        "mailNickname": email_nickname,
        "userPrincipalName": user_principal_name,
        "passwordProfile": {"forceChangePasswordNextSignIn": True, "password": tmp_password},
        # additional
        "givenName": member_obj["forenames"],
        "surname": member_obj["surname"],
        "employeeId": str(member_obj["_id"]),
        "usageLocation": "GB",
        "jobTitle": member_obj.get("o365_title_override", member_obj["primary_role"]),  # use title override if present
        "department": member_obj["primary_role_location"],
        "companyName": organisation_name,
        "otherMails": [member_obj["main_email"]],
    }

    graph_app_id, graph_authority, graph_app_secret = graph_auth

    # Create the user account
    _setup_session(graph_app_id, graph_authority, graph_app_secret, session)

    # result = session.post(f"{GRAPH_URL}/users", json=create_obj, headers={"Content-Type": "application/json"})
    result = session.post(f"{GRAPH_URL}/users", json=create_obj)
    if result.status_code != 201:
        raise RuntimeError(f"Failed to create Office 365 account with details: {create_obj}")

    o365_id = result.json()["id"]
    _update_member_details(
        membership_id,
        {"o365_profile": {"id": o365_id, "mail": user_principal_name}, "last_o365_sync": datetime.datetime.now()}
    )

    # assign license
    _setup_session(graph_app_id, graph_authority, graph_app_secret, session)

    # https://docs.microsoft.com/en-us/azure/active-directory/enterprise-users/licensing-service-plan-reference
    # Office 365 E1: 18181a46-0d4e-45cd-891e-60aabd171b4e
    # Office 365 E2: 6634e0ce-1a9f-428c-a498-f84ec7b8aa2e
    # Office 365 E3: 6fd2c87f-b296-42f0-b197-1e91e994b900
    # Office 365 E4: 1392051d-0cb9-4b7a-88d5-621fee5e8711
    # Office 365 E5: c7df2760-2c81-4ef7-b578-5b5392b571df
    # Microsoft 365 E3: 05e9a617-0261-4cee-bb44-138d3ef5d965
    # Microsoft 365 E5: 06ebc4ee-1bb5-47dd-8120-11324bc54e06
    # Enterprise Mobility & Security: efccb6f7-5641-4e0e-bd10-b4976e1bf68e

    o365_license = {"addLicenses": [{"skuId": "6634e0ce-1a9f-428c-a498-f84ec7b8aa2e"}], "removeLicenses": []}
    result = session.post(f"{GRAPH_URL}/users/{o365_id}/assignLicense", json=o365_license)  # , headers={"Content-Type": "application/json"}
    if result.status_code != 200:
        raise RuntimeError(f"ERROR assigning license to user: {o365_id}")

    return None


# ## ### CLI SECTION ### ## #


def read_config_from_file(ctx: click.Context, _param: click.Parameter, file: TextIOWrapper | None) -> None:
    if file is None:
        return
    try:
        ctx.default_map = tomli.loads(file.read())
    except tomli.TOMLDecodeError:
        ctx.fail("Could not read config file!")


@click.command()
@click.option(
    "--config",
    type=click.File(mode="r", encoding="utf-8", lazy=False),
    callback=read_config_from_file,
    is_eager=True,
    expose_value=False,
    help="Read options from the specified toml-format configuration file. These are overridden by options passed on the"
    " command line.",
    show_default=True,
)
@click.option(
    "--compass-username",
    type=str,
    required=True,
    help="Username for logging in to Compass",
    envvar="COMPASS_USERNAME",
)
@click.option(
    "--compass-password",
    type=str,
    required=True,
    help="Password for logging in to Compass",
    envvar="COMPASS_PASSWORD",
)
@click.option(
    "--compass-role",
    type=str,
    help="Role for logging in to Compass. This is not required, but if given it must exactly match the name of the role"
    " as shown in your roles tab within Compass. By default, your primary role is used.",
    envvar="COMPASS_ROLE",
)
@click.option(
    "--compass-location",
    type=str,
    help="Location for logging in to Compass. This is not required, but if given it must exactly match the name of the"
    " location field for the corresponding role in the roles tab within Compass. Specifying the role location is only"
    " useful when you have multiple roles with the same role title.",
    envvar="COMPASS_LOCATION",
)
@click.option(
    "--tenant-id",
    type=str,
    required=True,
    help="Office 365 tenant ID. Should be of the form 'contoso.onmicrosoft.com'.",
    envvar="TENANT_ID",
)
@click.option(
    "--graph-app-id",
    type=str,
    required=True,
    help="Microsoft graph app ID.",
    envvar="GRAPH_APP_ID",
)
@click.option(
    "--graph-app-secret",
    type=str,
    required=True,
    help="Microsoft graph app secret.",
    envvar="GRAPH_APP_SECRET",
)
@click.option(
    "--o365-domain",
    type=str,
    required=True,
    help="Office 365 domain on which to assign user emails. Should be of the form 'example.org.uk'.",
    envvar="O365_DOMAIN",
)
@click.option(
    "--o365-domain",
    type=str,
    required=True,
    help="Your organisation's name, this will be set as users' company name. Should be of the form 'XYZ Scouts'.",
    envvar="ORG_NAME",
)
def cli(
    compass_username: str,
    compass_password: str,
    compass_role: str | None,
    compass_location: str | None,
    tenant_id: str,
    graph_app_id: str,
    graph_app_secret: str,
    o365_domain: str,
    organisation_name: str,
) -> None:
    api = ci.login(compass_username, compass_password, role=compass_role, location=compass_location)
    session = httpx.Client()

    # The actual function
    sync_compass_o365(
        api,
        o365_domain.lower(),
        organisation_name,
        (graph_app_id, f"https://login.microsoftonline.com/{tenant_id}", graph_app_secret),
        session
    )


if __name__ == '__main__':
    cli()
