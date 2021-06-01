import datetime

import pydantic
import pytest
import requests

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

base_domain = "127.0.0.1"
base_url = "http://127.0.0.1:4200"


class TestLogon:
    def test_login_get_cookie(self, server):
        # Given
        Settings.base_url = base_url

        # When
        client = logon._create_session()

        # Then
        assert isinstance(client, requests.Session)
        assert isinstance(client, Client)
        assert client.cookies["ASP.NET_SessionId"] == asp_net_id

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
                    jk="9b65d68f4aca0138b5bae4492e7cdfae220a834e3e69731d996be1ddbb496d32fd29497d4f9729525c9fbc77666bb520ea214c0802ea22b958e6ae525224fd15",  # NoQA: E501
                ),
                const=CompassPropsMasterConst(wales=10000007, scotland=10000005, over_seas=10000002, hq=10000001),
                sys=CompassPropsMasterSys(
                    session_id="d6c76537-1b6c-3910-c3d4-d21d4e6453a6",
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

    def test_login_from_session_props(self, server):
        # Given
        Settings.base_url = base_url
        user_props = {
            "cn": 10000000,
            "mrn": 9000000,
            "on": 10000001,
            "lvl": "ORG",
            "jk": "9b65d68f4aca0138b5bae4492e7cdfae220a834e3e69731d996be1ddbb496d32fd29497d4f9729525c9fbc77666bb520ea214c0802ea22b958e6ae525224fd15",  # NoQA: E501
        }
        session_id = "d6c76537-1b6c-3910-c3d4-d21d4e6453a6"
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
