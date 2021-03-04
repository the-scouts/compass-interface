import pytest
import requests

from compass.core.errors import CompassError
# from compass.core.logon import Logon
from compass.core.logon import LogonCore
from compass.core.logon import Settings
from tests.util.fake_compass import asp_net_id

base_domain = "127.0.0.1"
base_url = "http://127.0.0.1:4200"

# TODO we don't validate cookie presence except initially (LogonCore._create_session)


class TestLogon:
    def test_login_get_cookie(self, server):
        # Given
        Settings.base_url = base_url

        # When
        worker = LogonCore()

        # Then
        assert isinstance(worker.s, requests.Session)
        assert worker.s.cookies["ASP.NET_SessionId"] == asp_net_id

    def test_login_no_cookie(self, server):
        # Given
        Settings.base_url = f"{base_url}/_testing/no-cookie"

        # Then
        with pytest.raises(CompassError, match="Could not create a session with Compass"):
            # When
            LogonCore()

    def test_login_post_credentials(self, server):
        # Given
        Settings.base_url = base_url
        session = requests.Session()
        session.cookies.set("ASP.NET_SessionId", asp_net_id, domain=base_domain)
        worker = LogonCore(session=session)

        # When
        response, _props, _roles = worker.logon_remote(("username", "password"), verify=False)

        # Then
        expected_response = b"<head><title>Compass - System Startup</title><link rel='shortcut icon' type='image/vnd.microsoft.icon' href='https://compass.scouts.org.uk/Images/core/ico_compass.ico' sizes='16x16 24x24 32x32 48x48'></head><body onload='window.location.href=\"https://compass.scouts.org.uk/ScoutsPortal.aspx\"'></body>"
        assert response.content == expected_response

    def test_login_post_incorrect_credentials(self, server):
        # Given
        Settings.base_url = base_url
        session = requests.Session()
        session.cookies.set("ASP.NET_SessionId", asp_net_id, domain=base_domain)
        worker = LogonCore(session=session)

        # When
        response, _props, _roles = worker.logon_remote(("wrong", "credentials"), verify=False)

        # Then
        expected_response = b"<head><title>Compass - Failed Login</title><link rel='shortcut icon' type='image/vnd.microsoft.icon' href='https://compass.scouts.org.uk/Images/core/ico_compass.ico' sizes='16x16 24x24 32x32 48x48'></head><body onload='window.location.href=\"\"'></body>"
        assert response.content == expected_response
