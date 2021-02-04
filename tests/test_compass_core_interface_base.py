from pytest import MonkeyPatch
import requests

from compass.core.interface_base import InterfaceBase
from compass.core.settings import Settings


class TestInterfaceBase:
    def test_get(self, monkeypatch: MonkeyPatch):
        # Given
        data = "https://example.org"
        reqs = Settings.total_requests

        # When
        s = requests.Session()
        monkeypatch.setattr(s, "get", lambda *args, **kwargs: dict(args=args, kwargs=kwargs))
        result = InterfaceBase(s)._get(data)  # pylint: disable=protected-access

        # Then
        assert result["args"][0] == data
        assert reqs + 1 == Settings.total_requests

    def test_post(self, monkeypatch: MonkeyPatch):
        # Given
        data = "https://example.org"
        json = {"abc": 123, "xyz": 321}
        reqs = Settings.total_requests

        # When
        s = requests.Session()
        monkeypatch.setattr(s, "post", lambda *args, **kwargs: dict(args=args, kwargs=kwargs))
        result = InterfaceBase(s)._post(data, json=json)  # pylint: disable=protected-access

        # Then
        assert result["args"][0] == data
        assert result["kwargs"]["json"] == json
        assert reqs + 1 == Settings.total_requests

    def test_head(self, monkeypatch: MonkeyPatch):
        # Given
        data = "https://example.org"
        reqs = Settings.total_requests

        # When
        s = requests.Session()
        monkeypatch.setattr(s, "head", lambda *args, **kwargs: dict(args=args, kwargs=kwargs))
        result = InterfaceBase(s)._head(data)  # pylint: disable=protected-access

        # Then
        assert result["args"][0] == data
        assert reqs + 1 == Settings.total_requests

    def test_update_headers(self):
        # Given
        data = {"header_one": 123, "abc_xyz": 321}

        # When
        ib = InterfaceBase(requests.Session())
        ib._update_headers(data)  # pylint: disable=protected-access

        # Then
        assert data.items() <= ib.s.headers.items()
