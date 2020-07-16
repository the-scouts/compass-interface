import requests
from lxml import html

from src.utility import CompassSettings


class CompassLogon:
    def __init__(self, credentials: list, role_to_use: str):
        self._member_role_number = 0
        self.credentials = credentials
        self.role_to_use = role_to_use

        self.session: requests.sessions.Session = self.do_logon()

    @property
    def mrn(self) -> int:
        return self._member_role_number

    @property
    def cn(self) -> int:
        return self._contact_name

    @property
    def jk(self) -> int:
        return self._jk

    def do_logon(self, credentials: list = None, role_to_use: str = None) -> requests.sessions.Session:
        # create session and get ASP.Net Session ID cookie from the compass server
        s = self.create_session()

        auth = credentials if credentials else self.credentials
        logon_response = self.logon(s, auth)

        # Create and set auth headers for post requests
        self.update_authentication(s, logon_response)

        if role_to_use:
            self.change_role(s, role_to_use, logon_response)
        elif self.role_to_use:
            self.change_role(s, self.role_to_use, logon_response)
        else:
            print("not changing role")

        return s

    @staticmethod
    def create_session() -> requests.sessions.Session:
        # create session and get ASP.Net Session ID cookie from the compass server
        session = requests.session()

        CompassSettings.total_requests += 1
        session.head(f"{CompassSettings.base_url}/", verify=False)  # use .head() as only headers needed to grab session cookie

        if not session.cookies:
            raise Exception("No cookie found, terminating.")

        return session

    @staticmethod
    def logon(s: requests.sessions.Session, auth: list):
        headers = {'Referer': f'{CompassSettings.base_url}/login/User/Login'}  # this is genuinely needed otherwise login doesn't work

        username = auth[0]
        password = auth[1]
        credentials = {
            'EM': f"{username}",
            'PW': f"{password}",
            'ON': f'{10000001}'
        }

        # log in
        print("Logging in")
        s.post(f'{CompassSettings.base_url}/Login.ashx', headers=headers, data=credentials, verify=False)
        CompassSettings.total_requests += 1
        response = s.get(f"{CompassSettings.base_url}/ScoutsPortal.aspx", verify=False)
        if response.url != f'{CompassSettings.base_url}/ScoutsPortal.aspx':
            raise Exception("Login has failed")
        else:
            form = html.fromstring(response.content).forms[0]
            roles = form.inputs['ctl00$UserTitleMenu$cboUCRoles']
            role_maps = {role.get("value"): role.text for role in roles.getchildren()}
            current_role = role_maps[roles.value]
            print(f"Logged in! Using Role: {current_role}")

        return form  # quick fix before doing auth headers and role change properly

    def update_authentication(self, s: requests.sessions.Session, form_tree) -> None:
        auth_headers = self.create_auth_headers(form_tree)
        s.headers.update(auth_headers)

    # @staticmethod
    def create_auth_headers(self, form_tree) -> dict:
        compass_dict = {}
        compass_vars = form_tree.fields["ctl00$_POST_CTRL"]
        for pair in compass_vars.split('~'):
            item = pair.split('#')
            key, value = item[0], item[1]
            compass_dict[key] = value
        self._contact_name = compass_dict["Master.User.CN"]
        self._jk = compass_dict["Master.User.JK"]
        self._member_role_number = compass_dict["Master.User.MRN"]
        session_id = compass_dict["Master.Sys.SessionID"]
        # return authorisation headers dictionary, header name: header value
        return {
            "Authorization": f'{self._contact_name}~{self._member_role_number}',
            "SID": session_id
        }

    def change_role(self, s: requests.sessions.Session, new_role, form_tree):
        print("Changing role")

        # get roles from compass page (list of option tags)
        roles_selector = form_tree.inputs['ctl00$UserTitleMenu$cboUCRoles']

        # List comp into dict comp to generate role name: role number dict
        roles_dict = {role.text: role.get("value") for role in roles_selector.getchildren()}

        # Get role number from roles dictionary
        self._member_role_number = roles_dict[new_role]

        # Change role to the specified role
        CompassSettings.total_requests += 1
        s.post(f"{CompassSettings.base_url}/API/ChangeRole", json={"MRN": self._member_role_number}, verify=False)

        print("Confirming role has been changed")
        # Check that the role has been changed to the desired role. If not, raise exception
        CompassSettings.total_requests += 1
        role_conf = s.get(f"{CompassSettings.base_url}/ScoutsPortal.aspx", verify=False).content
        new_form_tree = html.fromstring(role_conf).forms[0]

        selected_role = new_form_tree.inputs['ctl00$UserTitleMenu$cboUCRoles'].value
        if selected_role != self._member_role_number:
            raise Exception("Role failed to update in Compass")

        # Set auth headers for new role
        self.update_authentication(s, new_form_tree)
        print(f"Role changed to {new_role}")

    @staticmethod
    def get_available_roles(form_tree):
        # get roles from compass page (list of option tags)
        roles_selector = form_tree.inputs['ctl00$UserTitleMenu$cboUCRoles']

        # List comp into dict comp to generate role name: role number dict
        roles_dict = {role.text: role.get("value") for role in roles_selector.getchildren()}

        return roles_dict