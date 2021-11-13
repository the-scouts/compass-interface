import pytest

from compass.core import logon
import compass.core as ci
from compass.core.settings import Settings
from compass.core.util.client import Client

from tests.util.fake_compass import asp_net_id
from tests.util.fake_compass import session_id_default

base_domain = "127.0.0.1"
base_url = "http://127.0.0.1:4200"
jk_value = "9b65d68f4aca0138b5bae4492e7cdfae220a834e3e69731d996be1ddbb496d32fd29497d4f9729525c9fbc77666bb520ea214c0802ea22b958e6ae525224fd15"


class TestInit:
    def test_compass_interface(self):
        # Given
        Settings.base_url = base_url
        client = Client()
        client.cookies.set("ASP.NET_SessionId", asp_net_id, domain=Settings.base_domain)
        user_props = {"cn": 10000000, "mrn": 9000000, "on": 10000001, "lvl": "ORG", "jk": jk_value}
        session_id = session_id_default
        compass_props = ci.CompassProps.parse_obj({"master": {"user": user_props, "sys": {"session_id": session_id}}})
        current_role = "Role", "Place"
        session = logon.Logon(client=client, compass_props=compass_props, current_role=current_role)

        # When
        api = ci.CompassInterface(session)

        # Then
        assert api.user is session
        assert isinstance(api.people, ci.People)
        assert isinstance(api.hierarchy, ci.Hierarchy)
        assert isinstance(api.reports, ci.Reports)

    def test_login_from_logon(self, server):
        # Given
        Settings.base_url = base_url
        username = "username"
        password = "password"  # nosec (false positive B105; it is a hardcoded password, but a fake one)

        # When
        api = ci.login(username, password)

        # Then
        assert isinstance(api, ci.CompassInterface)  # we test everything else elsewhere

    @pytest.mark.skip("Changing roles is not implemented yet in fake_compass.")
    def test_login_from_logon_with_role(self, server):
        # Given
        Settings.base_url = base_url
        username = "username"
        password = "password"  # nosec (false positive B105; it is a hardcoded password, but a fake one)

        # When
        api = ci.login(username, password, role="")

        # Then
        assert isinstance(api, ci.CompassInterface)  # we test everything else elsewhere

    @pytest.mark.skip("Changing roles is not implemented yet in fake_compass.")
    def test_login_from_logon_with_location(self, server):
        # Given
        Settings.base_url = base_url
        username = "username"
        password = "password"  # nosec (false positive B105; it is a hardcoded password, but a fake one)

        # When
        api = ci.login(username, password, location="")

        # Then
        assert isinstance(api, ci.CompassInterface)  # we test everything else elsewhere

    @pytest.mark.skip("Changing roles is not implemented yet in fake_compass.")
    def test_login_from_logon_with_role_and_location(self, server):
        # Given
        Settings.base_url = base_url
        username = "username"
        password = "password"  # nosec (false positive B105; it is a hardcoded password, but a fake one)

        # When
        api = ci.login(username, password, role="", location="")

        # Then
        assert isinstance(api, ci.CompassInterface)  # we test everything else elsewhere
