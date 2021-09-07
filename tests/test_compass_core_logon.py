import datetime

import httpx
import pydantic
import pytest

from compass.core import logon
import compass.core as ci
from compass.core.schemas.logon import CompassPropsConst
from compass.core.schemas.logon import CompassPropsConstSys
from compass.core.schemas.logon import CompassPropsCRUD
from compass.core.schemas.logon import CompassPropsMaster
from compass.core.schemas.logon import CompassPropsMasterConst
from compass.core.schemas.logon import CompassPropsMasterSSO
from compass.core.schemas.logon import CompassPropsMasterSys
from compass.core.schemas.logon import CompassPropsMasterUser
from compass.core.schemas.logon import CompassPropsNav
from compass.core.schemas.logon import CompassPropsPage
from compass.core.schemas.logon import CompassPropsUser
from compass.core.settings import Settings
from compass.core.util.client import Client

from tests.util.fake_compass import asp_net_id
from tests.util.fake_compass import id_map
from tests.util.fake_compass import session_id_default
from tests.util.fake_compass import username_map

base_domain = "127.0.0.1"
base_url = "http://127.0.0.1:4200"
jk_value = "9b65d68f4aca0138b5bae4492e7cdfae220a834e3e69731d996be1ddbb496d32fd29497d4f9729525c9fbc77666bb520ea214c0802ea22b958e6ae525224fd15"


class TestLogon:
    def test_login_init(self):
        # Given
        Settings.base_url = base_url
        client = Client()
        client.cookies.set("ASP.NET_SessionId", asp_net_id, domain=Settings.base_domain)
        user_props = {"cn": 10000000, "mrn": 9000000, "on": 10000001, "lvl": "ORG", "jk": jk_value}
        session_id = session_id_default
        compass_props = ci.CompassProps.parse_obj({"master": {"user": user_props, "sys": {"session_id": session_id}}})
        current_role = "Role", "Place"

        # When
        session = logon.Logon(client=client, compass_props=compass_props, current_role=current_role)

        # Then
        assert isinstance(session._client, Client)
        assert isinstance(session._client, httpx.Client)
        assert session.compass_props == compass_props
        assert session.current_role == current_role
        assert isinstance(session.hierarchy, ci.HierarchyLevel)
        assert session.hierarchy.unit_id == 10000001
        assert session.hierarchy.level == "Organisation"
        assert session.membership_number == 10000000
        assert session.role_number == 9000000
        assert session._jk == user_props["jk"]
        assert session._asp_net_id == asp_net_id
        assert session._session_id == session_id_default

    def test_login_init_no_unit_number(self):
        # Given
        Settings.base_url = base_url
        client = Client()
        compass_props = ci.CompassProps.parse_obj({"master": {"user": {"lvl": "ORG"}}})
        current_role = "Role", "Place"

        # Then
        with pytest.raises(ci.CompassError, match="Unit Number and Level must be specified!"):
            # When
            logon.Logon(client=client, compass_props=compass_props, current_role=current_role)

    def test_login_init_no_unit_level(self):
        # Given
        Settings.base_url = base_url
        client = Client()
        compass_props = ci.CompassProps.parse_obj({"master": {"user": {"on": 10000001}}})
        current_role = "Role", "Place"

        # Then
        with pytest.raises(ci.CompassError, match="Unit Number and Level must be specified!"):
            # When
            logon.Logon(client=client, compass_props=compass_props, current_role=current_role)

    def test_login_init_no_membership_number(self):
        # Given
        Settings.base_url = base_url
        client = Client()
        user_props = {"mrn": 9000000, "on": 10000001, "lvl": "ORG", "jk": jk_value}
        compass_props = ci.CompassProps.parse_obj({"master": {"user": user_props}})
        current_role = "Role", "Place"

        # Then
        with pytest.raises(ci.CompassError, match="User IDs must be specified!"):
            # When
            logon.Logon(client=client, compass_props=compass_props, current_role=current_role)

    def test_login_init_no_role_number(self):
        # Given
        Settings.base_url = base_url
        client = Client()
        user_props = {"cn": 10000000, "on": 10000001, "lvl": "ORG", "jk": jk_value}
        compass_props = ci.CompassProps.parse_obj({"master": {"user": user_props}})
        current_role = "Role", "Place"

        # Then
        with pytest.raises(ci.CompassError, match="User IDs must be specified!"):
            # When
            logon.Logon(client=client, compass_props=compass_props, current_role=current_role)

    def test_login_init_no_jk(self):
        # Given
        Settings.base_url = base_url
        client = Client()
        user_props = {"cn": 10000000, "mrn": 9000000, "on": 10000001, "lvl": "ORG"}
        compass_props = ci.CompassProps.parse_obj({"master": {"user": user_props}})
        current_role = "Role", "Place"

        # Then
        with pytest.raises(ci.CompassError, match="User IDs must be specified!"):
            # When
            logon.Logon(client=client, compass_props=compass_props, current_role=current_role)

    def test_login_init_no_session_id(self):
        # Given
        Settings.base_url = base_url
        client = Client()
        client.cookies.set("ASP.NET_SessionId", asp_net_id, domain=Settings.base_domain)
        user_props = {"cn": 10000000, "mrn": 9000000, "on": 10000001, "lvl": "ORG", "jk": jk_value}
        compass_props = ci.CompassProps.parse_obj({"master": {"user": user_props}})
        current_role = "Role", "Place"

        # Then
        with pytest.raises(ci.CompassError, match="ASP.NET ID must be specified!"):
            # When
            logon.Logon(client=client, compass_props=compass_props, current_role=current_role)

    def test_login_from_logon(self, server):
        # Given
        Settings.base_url = base_url
        credentials = "username", "password"

        # When
        session = logon.Logon.from_logon(credentials)

        # Then
        assert isinstance(session._asp_net_id, str)
        assert session._asp_net_id.islower()
        assert session._asp_net_id.isalnum()
        assert len(session._asp_net_id) == 24
        assert session._asp_net_id == session._client.cookies["ASP.NET_SessionId"]

        assert session._session_id == id_map[session._asp_net_id]
        assert session._client.headers["SID"] == id_map[session._asp_net_id]

        assert session._client.headers["Authorization"] == "10000000~9000000"

        assert session.current_role == ("Regional Administrator", "Wessex")
        assert session.hierarchy.unit_id == 10000001
        assert session.hierarchy.level == "Organisation"
        assert session.membership_number == 10000000
        assert session.role_number == 9000000
        assert session._jk == jk_value

    def test_login_from_logon_no_member_number(self, server):
        # Given
        Settings.base_url = base_url
        credentials = "no_role_number", "password"

        # Then
        with pytest.raises(ci.CompassError):
            # When
            logon.Logon.from_logon(credentials)

    @pytest.mark.skip("Changing roles is not implemented yet in fake_compass.")
    def test_login_from_logon_role_to_use(self, server):
        # TODO add change role functionality in fake_compass
        pass

    def test_login_from_session(self):
        # Given
        Settings.base_url = base_url
        user_props = {
            "cn": 10000000,
            "mrn": 9000000,
            "on": 10000001,
            "lvl": "ORG",
            "jk": jk_value,
        }
        session_id = session_id_default
        current_role = "Role", "Place"

        # When
        session = logon.Logon.from_session(asp_net_id, user_props, session_id, current_role)

        # Then
        assert session._client.cookies["ASP.NET_SessionId"] == asp_net_id
        assert session._asp_net_id == asp_net_id

        assert session._session_id == session_id
        assert session._client.headers["SID"] == session_id

        assert session._client.headers["Authorization"] == f'{user_props["cn"]}~{user_props["mrn"]}'

        assert session.current_role == current_role
        assert session.membership_number == user_props["cn"]
        assert session.role_number == user_props["mrn"]
        assert session._jk == user_props["jk"]

    def test_login_repr(self):
        # Given
        Settings.base_url = base_url
        client = Client()
        client.cookies.set("ASP.NET_SessionId", asp_net_id, domain=Settings.base_domain)
        user_props = {"cn": 10000000, "mrn": 9000000, "on": 10000001, "lvl": "ORG", "jk": jk_value}
        session_id = session_id_default
        compass_props = ci.CompassProps.parse_obj({"master": {"user": user_props, "sys": {"session_id": session_id}}})
        current_role = "Role", "Place"

        # When
        session = logon.Logon(client=client, compass_props=compass_props, current_role=current_role)

        # Then
        assert repr(session) == "<Logon> Compass ID: 10000000 (Role - Place)"

    def test_login_get_cookie(self, server):
        # Given
        Settings.base_url = base_url

        # When
        client = logon._create_session()

        # Then
        assert isinstance(client, httpx.Client)
        assert isinstance(client, Client)
        assert isinstance(client.cookies["ASP.NET_SessionId"], str)
        assert client.cookies["ASP.NET_SessionId"].islower()
        assert client.cookies["ASP.NET_SessionId"].isalnum()
        assert len(client.cookies["ASP.NET_SessionId"]) == 24

    def test_login_no_cookie(self, server):
        # Given
        Settings.base_url = f"{base_url}/_testing/no-cookie"

        # Then
        with pytest.raises(ci.CompassError, match="Could not create a session with Compass"):
            # When
            logon._create_session()

    # TODO this test is useless
    def test_login_post_credentials(self, server, monkeypatch: pytest.MonkeyPatch):
        # Given
        Settings.base_url = base_url
        client = Client()
        client.cookies.set("ASP.NET_SessionId", asp_net_id, domain=base_domain)

        # When
        monkeypatch.setattr(logon, "_check_login", lambda _client: (ci.CompassProps(), {}))
        _props, _roles = logon._logon_remote(client, ("username", "password"))

        # Then
        assert client.cookies["ASP.NET_SessionId"] == asp_net_id  # always need cookie

    # TODO this test is useless
    def test_login_post_incorrect_credentials(self, server, monkeypatch: pytest.MonkeyPatch):
        # Given
        Settings.base_url = base_url
        client = Client()
        client.cookies.set("ASP.NET_SessionId", asp_net_id, domain=base_domain)

        # When
        monkeypatch.setattr(logon, "_check_login", lambda _client: (ci.CompassProps(), {}))
        _props, _roles = logon._logon_remote(client, ("wrong", "credentials"))

        # Then
        assert client.cookies["ASP.NET_SessionId"] == asp_net_id  # always need cookie

    def test_login_check_login(self, server):
        # Given
        Settings.base_url = base_url
        client = Client()
        client.cookies.set("ASP.NET_SessionId", asp_net_id, domain=base_domain)
        id_map[asp_net_id] = session_id_default
        username_map[asp_net_id] = "username"

        # When
        props, roles = logon._check_login(client)

        # Then
        expected_props = ci.CompassProps(
            nav=CompassPropsNav(action="None", start_no=-1, start_page=3),
            page=CompassPropsPage(
                use_cn=10000000,
                hide_badges=True,
                croc="OK",
                hide_nominations=True,
                can_delete_ogl_hrs=False,
                fold_name="MP_",
            ),
            crud=CompassPropsCRUD(mdis="R", roles="R", pemd="R", mmmd="R", mvid="R", perm="R", trn="CRD"),
            user=CompassPropsUser(is_me=True),
            master=CompassPropsMaster(
                sso=CompassPropsMasterSSO(on=10000001),
                user=CompassPropsMasterUser(
                    cn=10000000,
                    mrn=9000000,
                    on=10000001,
                    lvl="ORG",
                    jk=jk_value,
                ),
                const=CompassPropsMasterConst(wales=10000007, scotland=10000005, over_seas=10000002, hq=10000001),
                sys=CompassPropsMasterSys(
                    session_id=session_id_default,
                    safe_json=True,
                    web_path=pydantic.HttpUrl(
                        "https://compass.scouts.org.uk/JSon.svc/",
                        scheme="https",
                        host="compass.scouts.org.uk",
                        tld="uk",
                        host_type="domain",
                        path="/JSon.svc/",
                    ),
                    text_size=1,
                    timout=1729000,
                    rest=True,
                    hard_time=datetime.time(20, 18, 28),
                    hard_expiry="6 hours",
                    timeout_extension=10,
                    ping=300000,
                ),
            ),
            const=CompassPropsConst(sys=CompassPropsConstSys(sto=5, sto_ask=0)),
        )

        expected_roles = {
            9000000: ("Regional Administrator", "Wessex"),
            6857721: ("TSA Council Member - Nominated Member (18-24)", "The Scout Association"),
        }

        assert client.cookies["ASP.NET_SessionId"] == asp_net_id  # always need cookie
        assert props == expected_props
        assert roles == expected_roles
