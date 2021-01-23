import datetime
import time
from typing import Optional

import certifi
from lxml import html
import requests

from compass.errors import CompassAuthenticationError
from compass.errors import CompassError
from compass.interface_base import InterfaceBase
from compass.logging import logger
from compass.settings import Settings
from compass.utility import cast
from compass.utility import compass_restify
from compass.utility import setup_tls_certs


class Logon(InterfaceBase):
    def __init__(self, credentials: tuple[str, str], role_to_use: str = None):
        """Constructor for Logon."""
        self._member_role_number = 0
        self.compass_dict = {}

        self.role_to_use: str = role_to_use

        self.current_role: str = ""
        self.current_role_number: int = 0
        self.roles_dict: dict = {}

        super().__init__(self._do_logon(credentials, role_to_use))

    @property
    def mrn(self) -> int:
        return self.compass_dict["Master.User.MRN"]  # Member Role Number

    @property
    def cn(self) -> int:
        return self.compass_dict["Master.User.CN"]  # Contact Number

    @property
    def jk(self) -> int:
        return self.compass_dict["Master.User.JK"]  # ???? Key?

    # pylint: disable=arguments-differ
    def _get(self, url: str, auth_header: bool = False, session: Optional[requests.Session] = None, **kwargs) -> requests.Response:
        """Override get method with custom auth_header logic."""
        if auth_header:
            headers = {"Auth": self._jk_hash()}
            params = {
                "x1": f"{self.cn}",
                "x2": f"{self.jk}",
                "x3": f"{self.mrn}",
            }
            kwargs["headers"] = {**kwargs.get("headers", {}), **headers}
            kwargs["params"] = {**kwargs.get("params", {}), **params}

        if session is not None:
            return session.get(url, **kwargs)
        else:
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

    def _do_logon(self, credentials: tuple[str, str] = None, role_to_use: str = None) -> requests.Session:
        """Log in to Compass, change role and confirm success."""
        session = self._create_session()

        # Log in and try to confirm success
        self._logon_remote(credentials, session)
        self._confirm_login_success(session)

        # Session contains updated auth headers from role change
        session = self.change_role(role_to_use, session=session)

        return session

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
            raise CompassError("No cookie found, terminating.")

        return session

    @staticmethod
    def _logon_remote(auth: tuple[str, str], session: requests.Session) -> requests.Response:
        """Interface code with Compass."""
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
        response = session.post(f"{Settings.base_url}/Login.ashx", headers=headers, data=credentials)
        return response

    def change_role(self, new_role: Optional[str], session: Optional[requests.Session] = None) -> requests.Session:
        """Update role information."""
        if session is None:
            try:
                session = self.s
            except AttributeError:
                raise ValueError("No session! session object must be passed or self.s set.") from None

        if new_role is not None:
            logger.info("Changing role")
            new_role = new_role.strip()

            # Change role to the specified role number
            member_role_number = {v: k for k, v in self.roles_dict.items()}[new_role]
            session.post(f"{Settings.base_url}/API/ChangeRole", json={"MRN": str(member_role_number)})
        else:
            logger.info("not changing role")
            member_role_number = self.current_role_number

        # Confirm Compass is reporting the changed role number, update auth headers
        form_tree = self._confirm_role_change(session, member_role_number)
        session = self._update_authorisation(form_tree, session)

        if member_role_number != self.mrn:
            raise CompassAuthenticationError("Compass Authentication failed to update")

        logger.info(f"Role updated successfully! Role is now {self.current_role}.")

        return session

    @staticmethod
    def _create_compass_dict(form_tree: html.FormElement) -> dict:
        """Create Compass info dict from FormElement."""
        compass_dict = {}
        compass_vars = form_tree.fields["ctl00$_POST_CTRL"]
        for pair in compass_vars.split("~"):
            key, value, *_ = pair.split("#")
            compass_dict[key] = cast(value)

        return compass_dict

    @staticmethod
    def _create_roles_dict(form_tree: html.FormElement) -> dict:
        """Generate role number to role name mapping."""
        roles_selector = form_tree.inputs["ctl00$UserTitleMenu$cboUCRoles"]  # get roles from compass page (list of option tags)
        return {int(role.get("value")): role.text.strip() for role in roles_selector}

    @staticmethod
    def _get_active_role_number(form_tree: html.FormElement) -> int:
        """Gets active (selected) role from FormElement."""
        return int(form_tree.inputs["ctl00$UserTitleMenu$cboUCRoles"].value)

    def _confirm_login_success(self, session: requests.Session) -> None:
        """Confirms success and updates authorisation."""
        portal_url = f"{Settings.base_url}/ScoutsPortal.aspx"
        response = self._get(portal_url, session=session)

        # # Response body is login page for failure (~8Kb), but success is a 300 byte page.
        # if int(post_response.headers.get("content-length", 901)) > 900:
        #     raise CompassAuthenticationError("Login has failed")
        if response.url != portal_url:
            raise CompassAuthenticationError("Login has failed")

        form = html.fromstring(response.content).forms[0]
        self._update_authorisation(form, session)

    def _confirm_role_change(self, session: requests.Session, check_role_number: int) -> html.FormElement:
        """Confirms success and updates authorisation."""
        portal_url = f"{Settings.base_url}/ScoutsPortal.aspx"
        response = self._get(portal_url, session=session)
        form = html.fromstring(response.content).forms[0]

        logger.debug("Confirming role has been changed")
        # Check that the role has been changed to the desired role. If not, raise exception.
        if self._get_active_role_number(form) != check_role_number:
            raise CompassError("Role failed to update in Compass")

        return form

    def _update_authorisation(self, form: html.FormElement, session: requests.Session) -> requests.Session:
        """Update authorisation data."""
        self.compass_dict = self._create_compass_dict(form)  # Updates MRN property etc.
        self.roles_dict = self._create_roles_dict(form)

        # Set auth headers for new role
        auth_headers = {
            "Authorization": f"{self.cn}~{self.mrn}",
            "SID": self.compass_dict["Master.Sys.SessionID"],  # Session ID
        }
        session.headers.update(auth_headers)

        # TODO is this get role bit needed given that we change the role?
        self.current_role = self.roles_dict[int(self.mrn)]
        self.current_role_number = self._get_active_role_number(form)
        logger.debug(f"Using Role: {self.current_role}")

        return session
