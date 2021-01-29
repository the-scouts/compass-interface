from __future__ import annotations

from typing import TYPE_CHECKING

from compass.core.settings import Settings

if TYPE_CHECKING:
    import requests


class InterfaceBase:
    """Base class for interacting with the Compass server."""

    def __init__(self, session: requests.Session):
        """Constructor for InterfaceBase."""
        self.s: requests.Session = session

    def _get(self, url: str, **kwargs) -> requests.Response:
        Settings.total_requests += 1
        return self.s.get(url, **kwargs)

    def _post(self, url: str, **kwargs) -> requests.Response:
        Settings.total_requests += 1
        data = kwargs.pop("data", None)
        json_ = kwargs.pop("json", None)
        return self.s.post(url, data=data, json=json_, **kwargs)

    def _head(self, url: str, **kwargs) -> requests.Response:
        Settings.total_requests += 1
        return self.s.head(url, **kwargs)

    def _update_headers(self, headers: dict) -> None:
        self.s.headers.update(headers)
