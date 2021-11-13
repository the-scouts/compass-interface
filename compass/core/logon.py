from __future__ import annotations

import datetime
from typing import Any, Literal, Optional, TYPE_CHECKING, Union
import urllib.parse

from lxml import html
import requests

from compass.core import schemas
from compass.core import utility
from compass.core.errors import CompassAuthenticationError
from compass.core.errors import CompassError
from compass.core.interface_base import InterfaceBase
from compass.core.logger import logger
import compass.core.schemas.logon as schema
from compass.core.settings import Settings

if TYPE_CHECKING:
    from collections.abc import Iterator

TYPES_UNIT_LEVELS = Literal["Group", "District", "County", "Region", "Country", "Organisation"]
TYPES_STO = Literal[None, "0", "5", "X"]
TYPES_ROLE = tuple[str, str]
TYPES_ROLES_DICT = dict[int, TYPES_ROLE]


def login(username: str, password: str, /, *, role: Optional[str] = None, location: Optional[str] = None) -> Logon:
    """Log in to compass, return a compass.logon.Logon object.

    This function is provided as a convenient interface to the logon module.
    """
    return Logon.from_logon((username, password), role, location)


class Logon:
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
        session: requests.Session,
        compass_props: schema.CompassProps,
        roles_dict: Optional[TYPES_ROLES_DICT] = None,
        current_role: TYPES_ROLE,
    ):
        """Constructor for Logon."""
        self.compass_props: schema.CompassProps = compass_props
        self.roles_dict: TYPES_ROLES_DICT = roles_dict or {}
        self.current_role: TYPES_ROLE = current_role or ("", "")

        self._sto_thread = utility.PeriodicTimer(150, self._extend_session_timeout)
        # self._sto_thread.start()

        self._asp_net_id: str = session.cookies["ASP.NET_SessionId"]
        self._session_id: str = self.compass_props.master.sys.session_id

        # For session timeout logic
        self._session = session

        # Set these last, treat as immutable after we leave init. Role can
        # theoretically change, but this is not supported behaviour.
        self.member_number = self.compass_props.master.user.cn  # Contact Number
        self.role_number = self.compass_props.master.user.mrn  # Member Role Number
        self._jk = self.compass_props.master.user.jk  # ???? Key?  # Join Key??? SHA2-512

    @classmethod
    def from_logon(
        cls: type[Logon],
        credentials: tuple[str, str] = None,
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
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            CompassError:
                If initial connection to Compass fails
            CompassAuthenticationError:
                If authentication with Compass fails

        """
        worker = LogonCore.create_session()
        session = worker.s

        # Log in and try to confirm success
        _response, props, roles = worker.logon_remote(credentials)

        logon = cls(
            session=session,
            compass_props=props,
            roles_dict=roles,
            current_role=roles[props.master.user.mrn],  # Set explicitly as work done in worker
        )

        if role_to_use is not None:
            # Session contains updated auth headers from role change
            logon._change_role(session, role_to_use, role_location)  # pylint: disable=protected-access

        return logon

    @classmethod
    def from_session(cls: type[Logon], asp_net_id: str, user_props: dict[str, Union[str, int]], current_role: TYPES_ROLE) -> Logon:
        """Initialise a Logon object with stored data.

        This method  is used to avoid logging in many times, by enabling reuse
        of an existing sever-side session in Compass. It is used by the main
        compass-interface web API.

        Args:
            asp_net_id: ASP.NET Session ID, from cookie
            user_props: Compass master.sys.user properties
            current_role: Role used by initialised session

        Returns:
            Initialised Logon object

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        session: requests.Session = utility.CountingSession()
        session.cookies.set("ASP.NET_SessionId", asp_net_id, domain=Settings.base_domain)

        logon = cls(
            session=session,
            compass_props=schema.CompassProps.parse_obj({"master": {"user": dict(user_props)}}),
            current_role=current_role,
        )

        # Disable pylint protected-access check
        LogonCore(session=session).update_auth_headers(logon.member_number, logon.role_number, logon._session_id)  # NoQA: W0212

        return logon

    def __repr__(self) -> str:
        """String representation of the Logon class."""
        return f"{self.__class__} Compass ID: {self.member_number} ({' - '.join(self.current_role)})"

    @property
    def hierarchy(self) -> schemas.hierarchy.HierarchyLevel:
        unit_number = self.compass_props.master.user.on  # Organisation Number
        unit_level = self.compass_props.master.user.lvl  # Level
        level_map = {
            "ORG": "Organisation",
            # "ORST": "Organisation Sections",
            "CNTR": "Country",
            # "CNST": "Country Sections",
            "REG": "Region",
            # "RGST": "Regional Sections",
            "CNTY": "County",  # Also Area/Scot Reg/Branch
            # "CTST": "County Sections",  # Also Area/Scot Reg/Branch
            "DIST": "District",
            # "DTST": "District Sections",
            "SGRP": "Group",
            # "SGST": "Group Sections",
        }

        return schemas.hierarchy.HierarchyLevel(unit_id=unit_number, level=level_map[unit_level])

    def _extend_session_timeout(self, sto: TYPES_STO = "0") -> requests.Response:
        # Session time out. 4 values: None (normal), 0 (STO prompt) 5 (Extension, arbitrary constant) X (Hard limit)
        logger.debug(f"Extending session length {datetime.datetime.now()}")
        # TODO check STO.js etc for what happens when STO is None/undefined
        return utility.auth_header_get(
            self.member_number,
            self.role_number,
            self._jk,
            self._session,
            f"{Settings.web_service_path}/STO_CHK",
            params={"pExtend": sto},
        )

    def _change_role(self, session: requests.Session, new_role: str, location: Optional[str] = None) -> Logon:
        """Returns new Logon object with new role.

        If the user has multiple roles with the same role title, the first is used,
        unless the location parameter is set, where the location is exactly matched.
        """
        logger.info("Changing role")

        new_role = new_role.strip()

        worker = LogonCore(session=session)

        # If we don't have the roles dict, generate it.
        if not self.roles_dict:
            _props, self.roles_dict = worker.check_login()

        # Change role to the specified role number
        if location is not None:
            location = location.strip()
            member_role_number = next(num for num, name in self.roles_dict.items() if name == (new_role, location))
        else:
            member_role_number = next(num for num, name in self.roles_dict.items() if name[0] == new_role)

        response = session.post(f"{Settings.base_url}/API/ChangeRole", json={"MRN": member_role_number})  # b"false"
        Settings.total_requests += 1
        logger.debug(f"Compass ChangeRole call returned: {response.json()}")

        # Confirm Compass is reporting the changed role number, update auth headers
        self.compass_props, self.roles_dict = worker.check_login(check_role_number=member_role_number)
        self.current_role = self.roles_dict[member_role_number]  # Set explicitly as work done in worker

        logger.info(f"Role updated successfully! Role is now {self.current_role[0]} ({self.current_role[1]}).")

        return self


class LogonCore(InterfaceBase):
    @classmethod
    def create_session(cls: type[LogonCore]) -> LogonCore:
        """Create a session and get ASP.Net Session ID cookie from the compass server."""
        session: requests.Session = utility.CountingSession()

        session.head(f"{Settings.base_url}/")  # use .head() as only headers needed to grab session cookie
        Settings.total_requests += 1

        if not session.cookies:
            raise CompassError(
                "Could not create a session with Compass. Please check that this programme can "
                "access Compass (including firewalls etc.) and that Compass is currently online. "
            )

        return cls(session)

    def logon_remote(self, auth: tuple[str, str]) -> tuple[requests.Response, schema.CompassProps, TYPES_ROLES_DICT]:
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
        response = self.s.post(f"{Settings.base_url}/Login.ashx", headers=headers, data=credentials)

        # verify log in was successful
        props, roles = self.check_login()

        return response, props, roles

    def check_login(self, check_role_number: Optional[int] = None) -> tuple[schema.CompassProps, TYPES_ROLES_DICT]:
        """Confirms success and updates authorisation."""
        # Test 'get' for an exemplar page that needs authorisation.
        portal_url = f"{Settings.base_url}/MemberProfile.aspx?Page=ROLES&TAB"
        response = self.s.get(portal_url)

        # # Response body is login page for failure (~8Kb), but success is a 300 byte page.
        # if int(post_response.headers.get("content-length", 901)) > 900:
        #     raise CompassAuthenticationError("Login has failed")
        # Naive check for error, Compass redirects to an error page when something goes wrong
        # TODO what is the error page URL - what do we expect? From memory Error.aspx
        if response.url != portal_url:
            raise CompassAuthenticationError("Login has failed")

        # Create lxml html.FormElement
        form = html.fromstring(response.content).forms[0]

        # Update session dicts with new role
        compass_props = self._create_compass_props(form)  # Updates MRN property etc.
        roles_dict = dict(self._roles_iterator(form))

        member_number = compass_props.master.user.cn
        role_number = compass_props.master.user.mrn
        session_id = compass_props.master.sys.session_id

        # Set auth headers for new role
        self.update_auth_headers(member_number, role_number, session_id)

        # Update current role properties
        current_role_title, current_role_location = roles_dict[role_number]
        logger.debug(f"Using Role: {current_role_title} ({current_role_location})")

        # Verify role number against test value
        if check_role_number is not None:
            logger.debug("Confirming role has been changed")
            # Check that the role has been changed to the desired role. If not, raise exception.
            if check_role_number != role_number:
                raise CompassAuthenticationError("Role failed to update in Compass")

        return compass_props, roles_dict

    def update_auth_headers(self, membership_number: int, role_number: int, session_id: str) -> None:
        auth_headers = {
            "Authorization": f"{membership_number}~{role_number}",
            "SID": session_id,  # Session ID
        }
        self.s.headers.update(auth_headers)

    @staticmethod
    def _create_compass_props(form_tree: html.FormElement) -> schema.CompassProps:
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
            compass_props_master_sys = compass_props["Master"]["Sys"]
            if "WebPath" in compass_props_master_sys:
                compass_props_master_sys["WebPath"] = urllib.parse.unquote(compass_props_master_sys["WebPath"])
            if "HardTime" in compass_props_master_sys:
                hard_time_isoformat = compass_props_master_sys["HardTime"].replace(".", ":")
                compass_props_master_sys["HardTime"] = datetime.time.fromisoformat(hard_time_isoformat)

        return schema.CompassProps(**compass_props)

    @staticmethod
    def _roles_iterator(form_tree: html.FormElement) -> Iterator[tuple[int, TYPES_ROLE]]:
        """Generate role number to role name mapping."""
        roles_rows = form_tree.xpath("//tbody/tr")  # get roles from compass page (list of table rows (tr))
        for row in roles_rows:
            if "Full" in row[5].text_content():  # TODO do prov roles show up in selector???
                yield int(row.get("data-pk")), (row[0].text_content().strip(), row[2].text_content().strip())
