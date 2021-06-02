from __future__ import annotations

import datetime
from typing import Any, Final, Literal, Optional, TYPE_CHECKING, Union
import urllib.parse

from lxml import html

import compass.core as ci
from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core.util import auth_header
from compass.core.util.client import Client

if TYPE_CHECKING:
    from collections.abc import Iterator

    _TYPES_STO = Literal[None, "0", "5", "X"]
    _TYPES_ROLES_DICT = dict[int, ci.TYPES_ROLE]
    _TYPES_LEVEL_MAP = dict[ci.TYPES_ORG_LEVELS, ci.TYPES_HIERARCHY_LEVELS]

_level_map: _TYPES_LEVEL_MAP = {
    "ORG": "Organisation",
    "ORST": "Organisation Section",
    "CNTR": "Country",
    "CNST": "Country Section",
    "REG": "Region",
    "RGST": "Regional Section",
    "CNTY": "County",  # Also Area/Scot Reg/Branch
    "CTST": "County Section",  # Also Area/Scot Reg/Branch
    "DIST": "District",
    "DTST": "District Section",
    "SGRP": "Group",
    "SGST": "Group Section",
}


class Logon:  # pylint: disable=too-many-instance-attributes
    """Create connection to Compass and authenticate. Holds session state.

    Logon flow is:
    1. Create a persistent state object (Session) to hold headers, cookies etc.
      a. Get ASP.NET session cookie from Compass. (HTTP request #1)
    2. Post login data to Compass. (HTTP request #2)
    3. Get sample page from Compass. (HTTP request #3)
    4. Verify login was successful
      a. Create dict of compass internal variables, e.g. Master.User.CN (POST_CTRL).
      b. Create dict of user's role title to internal role number
      c. Update data for authorisation headers for requests to Compass.
    IF Role title specified:
    5. Post new role number to Compass (HTTP request #4)
    6. Get sample page from Compass. (HTTP request #5)
    7. Get currently active role number, and check this equals the requested role number.
      a. Create dict of compass internal variables, e.g. Master.User.CN (POST_CTRL).
      b. Create dict of user's role title to internal role number
      c. Update data for authorisation headers for requests to Compass.

    """

    def __init__(
        self,
        *,
        client: Client,
        compass_props: ci.CompassProps,
        current_role: ci.TYPES_ROLE,
    ):
        """Constructor for Logon.

        We treat all properties as immutable after we leave init. Role can
        theoretically change in server-side state, but this is not supported
        behaviour.

        """
        self._client: Final[Client] = client

        self.compass_props: Final[ci.CompassProps] = compass_props
        self.current_role: Final[ci.TYPES_ROLE] = current_role
        user_props = compass_props.master.user

        # Default hierarchy level
        unit_number = user_props.on  # Organisation Number
        unit_level = user_props.lvl  # Level
        if unit_number is None or unit_level is None:
            raise ci.CompassError("Unit Number and Level must be specified!")
        self.hierarchy: Final = ci.HierarchyLevel(unit_id=unit_number, level=_level_map[unit_level])

        # User / role IDs
        if user_props.cn is None or user_props.mrn is None or user_props.jk is None:
            raise ci.CompassError("User IDs must be specified!")
        self.membership_number: Final[int] = user_props.cn
        self.role_number: Final[int] = user_props.mrn
        self._jk: Final[str] = user_props.jk  # ???? Key?  # Join Key??? SHA2-512

        # Session IDs
        self._asp_net_id: Final[str] = client.cookies["ASP.NET_SessionId"]
        if compass_props.master.sys.session_id is None:
            raise ci.CompassError("ASP.NET ID must be specified!")
        self._session_id: Final[str] = compass_props.master.sys.session_id

        # TODO session timeout logic

    @classmethod
    def from_logon(
        cls: type[Logon],
        credentials: tuple[str, str],
        role_to_use: Optional[str] = None,
        role_location: Optional[str] = None,
    ) -> Logon:
        """Initialise a Logon object with login information.

        Args:
            credentials: username and password
            role_to_use: Compass role to use
            role_location: Role location, if multiple identical role titles

        Returns:
            Initialised Logon object

        Raises:
            CompassNetworkError:
                For errors while executing the HTTP call
            CompassError:
                If initial connection to Compass fails
            CompassAuthenticationError:
                If authentication with Compass fails

        """
        client = _create_session()

        # Log in and try to confirm success
        props, roles = _logon_remote(client, credentials)

        if props.master.user.mrn is None:
            raise ci.CompassError("Role Number must be an integer!")

        if role_to_use is not None:
            # Session contains updated auth headers from role change
            current_role, _roles_dict, compass_props = _change_role(client, role_to_use, role_location)
            return cls(client=client, compass_props=compass_props, current_role=current_role)

        return cls(client=client, compass_props=props, current_role=roles[props.master.user.mrn])

    @classmethod
    def from_session(
        cls: type[Logon], asp_net_id: str, user_props: dict[str, Union[str, int]], session_id: str, current_role: ci.TYPES_ROLE
    ) -> Logon:
        """Initialise a Logon object with stored data.

        This method is used to avoid logging in many times, by enabling reuse
        of an existing sever-side session in Compass. It is used by the main
        compass-interface web API.

        Args:
            asp_net_id: ASP.NET Session ID, from cookie
            user_props: Compass master.sys.user properties
            session_id: Compass session UID
            current_role: Role used by initialised session

        Returns:
            Initialised Logon object

        """
        client = Client()
        client.cookies.set("ASP.NET_SessionId", asp_net_id, domain=Settings.base_domain)  # type: ignore[no-untyped-call]

        logon = cls(
            client=client,
            compass_props=ci.CompassProps.parse_obj({"master": {"user": dict(user_props), "sys": {"session_id": session_id}}}),
            current_role=current_role,
        )

        _update_auth_headers(client, logon.membership_number, logon.role_number, session_id)

        return logon

    def __repr__(self) -> str:
        """String representation of the Logon class."""
        return f"{self.__class__} Compass ID: {self.membership_number} ({' - '.join(self.current_role)})"

    def _extend_session_timeout(self, sto: _TYPES_STO = "0") -> str:
        # Session time out. 4 values: None (normal), 0 (STO prompt) 5 (Extension, arbitrary constant) X (Hard limit)
        logger.debug(f"Extending session length {datetime.datetime.now()}")
        # TODO check STO.js etc for what happens when STO is None/undefined
        response = auth_header.auth_header_get(
            (self.membership_number, self.role_number, self._jk),
            self._client,
            f"{Settings.web_service_path}/STO_CHK",
            params={"pExtend": sto},
        )
        return response.content.decode("utf-8")


def _change_role(
    client: Client,
    new_role: str,
    location: Optional[str] = None,
    roles_dict: Optional[_TYPES_ROLES_DICT] = None,
) -> tuple[ci.TYPES_ROLE, _TYPES_ROLES_DICT, ci.CompassProps]:
    """Returns new Logon object with new role.

    If the user has multiple roles with the same role title, the first is used,
    unless the location parameter is set, where the location is exactly matched.
    """
    logger.info("Changing role")

    new_role = new_role.strip()

    # If we don't have the roles dict, generate it.
    if roles_dict is None:
        _props, roles_dict = _check_login(client)

    # Change role to the specified role number
    if location is not None:
        location = location.strip()
        member_role_number = next(num for num, name in roles_dict.items() if name == (new_role, location))
    else:
        member_role_number = next(num for num, name in roles_dict.items() if name[0] == new_role)

    response = client.post(f"{Settings.base_url}/API/ChangeRole", json={"MRN": member_role_number})  # b"false"
    Settings.total_requests += 1
    logger.debug(f"Compass ChangeRole call returned: {response.json()}")

    # Confirm Compass is reporting the changed role number, update auth headers
    compass_props, roles_dict = _check_login(client, check_role_number=member_role_number)
    current_role = roles_dict[member_role_number]

    logger.info(f"Role updated successfully! Role is now {current_role[0]} ({current_role[1]}).")

    return current_role, roles_dict, compass_props


def _create_session() -> Client:
    """Create a session and get ASP.Net Session ID cookie from the compass server."""
    client = Client()

    client.head(f"{Settings.base_url}/")  # use .head() as only headers needed to grab session cookie
    Settings.total_requests += 1

    if not client.cookies:
        raise ci.CompassError(
            "Could not create a session with Compass. Please check that this programme can "
            "access Compass (including firewalls etc.) and that Compass is currently online. "
        )

    return client


def _logon_remote(client: Client, auth: tuple[str, str]) -> tuple[ci.CompassProps, _TYPES_ROLES_DICT]:
    """Log in to Compass and confirm success."""
    # Referer is genuinely needed otherwise login doesn't work
    headers = {"Referer": f"{Settings.base_url}/login/User/Login"}

    username, password = auth
    credentials = {
        "EM": f"{username}",  # assume email?
        "PW": f"{password}",  # password
        "ON": f"{Settings.org_number}",  # organisation number
    }

    # log in
    logger.info("Logging in")
    client.post(f"{Settings.base_url}/Login.ashx", headers=headers, data=credentials)

    # verify log in was successful
    props, roles = _check_login(client)

    return props, roles


def _check_login(client: Client, check_role_number: Optional[int] = None) -> tuple[ci.CompassProps, _TYPES_ROLES_DICT]:
    """Confirms success and updates authorisation."""
    # Test 'get' for an exemplar page that needs authorisation.
    portal_url = f"{Settings.base_url}/MemberProfile.aspx?Page=ROLES&TAB"
    response = client.get(portal_url)

    # # Response body is login page for failure (~8Kb), but success is a 300 byte page.
    # if int(post_response.headers.get("content-length", 901)) > 900:
    #     raise CompassAuthenticationError("Login has failed")
    # Naive check for error, Compass redirects to an error page when something goes wrong
    # TODO what is the error page URL - what do we expect? From memory Error.aspx
    if response.url != portal_url:
        raise ci.CompassAuthenticationError("Login has failed")

    # Create lxml html.FormElement
    form = html.fromstring(response.content).forms[0]

    # Update session dicts with new role
    compass_props = _create_compass_props(form)  # Updates MRN property etc.
    roles_dict = dict(_roles_iterator(form))

    master_props = compass_props.master
    if master_props.user.cn is None or master_props.user.mrn is None or master_props.sys.session_id is None:
        raise ci.CompassError("Login verification failed! User and Session IDs not found!")
    membership_number: int = master_props.user.cn
    role_number: int = master_props.user.mrn
    session_id: str = master_props.sys.session_id

    # Set auth headers for new role
    _update_auth_headers(client, membership_number, role_number, session_id)

    # Update current role properties
    current_role_title, current_role_location = roles_dict[role_number]
    logger.debug(f"Using Role: {current_role_title} ({current_role_location})")

    # Verify role number against test value
    if check_role_number is not None:
        logger.debug("Confirming role has been changed")
        # Check that the role has been changed to the desired role. If not, raise exception.
        if check_role_number != role_number:
            raise ci.CompassAuthenticationError("Role failed to update in Compass")

    return compass_props, roles_dict


def _create_compass_props(form_tree: html.FormElement) -> ci.CompassProps:
    """Create Compass info dict from FormElement."""
    compass_props: dict[str, Any] = {}
    compass_vars = form_tree.fields["ctl00$_POST_CTRL"]
    for pair in compass_vars.split("~"):
        key, value = pair.split("#", 1)
        cd_tmp = compass_props
        levels = key.split(".")
        for level in levels[:-1]:
            cd_tmp = cd_tmp.setdefault(level, {})
        cd_tmp[levels[-1]] = value  # int or str

    if "Sys" in compass_props.get("Master", {}):
        props_sys = compass_props["Master"]["Sys"]
        if "WebPath" in props_sys:
            props_sys["WebPath"] = urllib.parse.unquote(props_sys["WebPath"])
        if "HardTime" in props_sys:
            props_sys["HardTime"] = datetime.time.fromisoformat(props_sys["HardTime"].replace(".", ":"))

    return ci.CompassProps(**compass_props)


def _roles_iterator(form_tree: html.FormElement) -> Iterator[tuple[int, ci.TYPES_ROLE]]:
    """Generate role number to role name mapping."""
    roles_rows = form_tree.xpath("//tbody/tr")  # get roles from compass page (list of table rows (tr))
    for row in roles_rows:
        if "Full" in row[5].text_content():  # from looking at the compass support group, only `Full` roles can be selected
            yield int(row.get("data-pk")), (row[0].text_content().strip(), row[2].text_content().strip())


def _update_auth_headers(
    client: Client,
    membership_number: int,
    role_number: int,
    session_id: str,
) -> None:
    client.headers.update(
        Authorization=f"{membership_number}~{role_number}",
        SID=session_id,  # Session ID
    )
