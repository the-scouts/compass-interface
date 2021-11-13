import datetime
import time
from typing import Literal, Optional

import certifi
from lxml import html
import requests

from compass.core import schemas
from compass.core.errors import CompassAuthenticationError
from compass.core.errors import CompassError
from compass.core.interface_base import InterfaceBase
from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core.utility import cast
from compass.core.utility import compass_restify
from compass.core.utility import PeriodicTimer
from compass.core.utility import setup_tls_certs

TYPES_UNIT_LEVELS = Literal["Group", "District", "County", "Region", "Country", "Organisation"]


class Logon(InterfaceBase):
    def __init__(self, credentials: tuple[str, str], role_to_use: str = None):
        """Constructor for Logon."""
        self._member_role_number = 0
        self.compass_dict = {}

        self.role_to_use: str = role_to_use

        self.current_role: str = ""
        self.roles_dict: dict = {}

        # Create session
        super().__init__(self._create_session())

        # Log in and try to confirm success
        self._logon_remote(credentials)

        if role_to_use is not None:
            # Session contains updated auth headers from role change
            self.change_role(role_to_use)

        self.sto_thread = PeriodicTimer(150, self._extend_session_timeout)
        # self.sto_thread.start()

    # properties/accessors code:

    @property
    def mrn(self) -> int:
        return self.compass_dict["Master.User.MRN"]  # Member Role Number

    @property
    def cn(self) -> int:
        return self.compass_dict["Master.User.CN"]  # Contact Number

    @property
    def jk(self) -> int:
        return self.compass_dict["Master.User.JK"]  # ???? Key?

    @property
    def hierarchy(self) -> schemas.hierarchy.HierarchyLevel:
        unit_number = self.compass_dict["Master.User.ON"]  # Organisation Number
        unit_level = self.compass_dict["Master.User.LVL"]  # Level
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

        return schemas.hierarchy.HierarchyLevel(id=unit_number, level=level_map[unit_level])

    # _get override code:

    def _get(self, url: str, auth_header: bool = False, **kwargs) -> requests.Response:
        """Override get method with custom auth_header logic."""
        # pylint: disable=arguments-differ
        if auth_header:
            headers = {"Auth": self._jk_hash()}
            params = {
                "x1": f"{self.cn}",
                "x2": f"{self.jk}",
                "x3": f"{self.mrn}",
            }
            kwargs["headers"] = {**kwargs.get("headers", {}), **headers}
            kwargs["params"] = {**kwargs.get("params", {}), **params}

        return super(Logon, self)._get(url, **kwargs)

    def _jk_hash(self) -> str:
        """Generate JK Hash needed by Compass."""
        # hash_code(f"{time.time() * 1000:.0f}")
        member_no = self.cn
        key_hash = f"{time.time() * 1000:.0f}{self.jk}{self.mrn}{member_no}"  # JK, MRN & CN are all required.
        data = compass_restify({"pKeyHash": key_hash, "pCN": member_no})
        logger.debug(f"Sending preflight data {datetime.datetime.now()}")
        self._post(f"{Settings.base_url}/System/Preflight", json=data)
        return key_hash

    # Timeout code:

    def _extend_session_timeout(self, sto: Literal[None, "0", "5", "X"] = "0"):
        # Session time out. 4 values: None (normal), 0 (STO prompt) 5 (Extension, arbitrary constant) X (Hard limit)
        logger.debug(f"Extending session length {datetime.datetime.now()}")
        return self._get(f"{Settings.web_service_path}/STO_CHK", auth_header=True, params={"pExtend": sto})

    # Core login code:

    @staticmethod
    def _create_session() -> requests.Session:
        """Create a session and get ASP.Net Session ID cookie from the compass server."""
        session = requests.Session()

        # Setup SSL - see utility for reasoning
        setup_tls_certs()
        if certifi.where():
            session.verify = True
        else:
            raise RuntimeError("Certificates not loaded")

        session.head(f"{Settings.base_url}/")  # use .head() as only headers needed to grab session cookie

        if not session.cookies:
            raise CompassError(
                "Could not create a session with Compass. Please check that this programme can "
                "access Compass (including firewalls etc.) and that Compass is currently online. "
            )

        return session

    def _logon_remote(self, auth: tuple[str, str]) -> requests.Response:
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
        response = self._post(f"{Settings.base_url}/Login.ashx", headers=headers, data=credentials)

        # verify log in was successful
        self._verify_success_update_properties()

        return response

    def _verify_success_update_properties(self, check_role_number: int = None) -> None:
        """Confirms success and updates authorisation."""
        # Test 'get' for an exemplar page that needs authorisation.
        portal_url = f"{Settings.base_url}/MemberProfile.aspx?Page=ROLES&TAB"
        response = self._get(portal_url)

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
        self.compass_dict = self._create_compass_dict(form)  # Updates MRN property etc.
        self.roles_dict = self._create_roles_dict(form)

        # Set auth headers for new role
        auth_headers = {
            "Authorization": f"{self.cn}~{self.mrn}",
            "SID": self.compass_dict["Master.Sys.SessionID"],  # Session ID
        }
        self._update_headers(auth_headers)

        # Update current role properties
        self.current_role = self.roles_dict[self.mrn]
        location = next((row[2].text_content().strip() for row in form.xpath(f"//tbody/tr") if int(row.get("data-pk")) == self.mrn), "")
        logger.debug(f"Using Role: {self.current_role} ({location})")

        # Verify role number against test value
        if check_role_number is not None:
            logger.debug("Confirming role has been changed")
            # Check that the role has been changed to the desired role. If not, raise exception.
            if check_role_number != self.mrn:
                raise CompassAuthenticationError("Role failed to update in Compass")

    @staticmethod
    def _create_compass_dict(form_tree: html.FormElement) -> dict:
        """Create Compass info dict from FormElement."""
        compass_dict = {}
        compass_vars = form_tree.fields["ctl00$_POST_CTRL"]
        for pair in compass_vars.split("~"):
            key, value = pair.split("#", 1)
            compass_dict[key] = cast(value)  # int or str

        return compass_dict

    @staticmethod
    def _create_roles_dict(form_tree: html.FormElement) -> dict:
        """Generate role number to role name mapping."""
        roles_selector = form_tree.inputs["ctl00$UserTitleMenu$cboUCRoles"]  # get roles from compass page (list of option tags)
        return {int(role.get("value")): role.text.strip() for role in roles_selector}

    def change_role(self, new_role: str) -> None:
        """Update role information.

        If the user has multiple roles with the same role title, the first is used.
        """
        logger.info("Changing role")

        # Change role to the specified role number
        member_role_number = next(num for num, name in self.roles_dict.items() if name == new_role.strip())
        response = self._post(f"{Settings.base_url}/API/ChangeRole", json={"MRN": member_role_number})  # b"false"
        logger.debug(f"Compass ChangeRole call returned: {response.json()}")

        # Confirm Compass is reporting the changed role number, update auth headers
        self._verify_success_update_properties(check_role_number=member_role_number)

        logger.info(f"Role updated successfully! Role is now {self.current_role}.")
