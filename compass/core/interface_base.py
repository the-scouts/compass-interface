from __future__ import annotations

import datetime
import time
from typing import Any, Optional, TYPE_CHECKING

from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core import utility

if TYPE_CHECKING:
    from collections.abc import Mapping

    import requests


class InterfaceBase:
    """Base class for interacting with the Compass server."""

    def __init__(self, session: requests.Session):
        """Constructor for InterfaceBase."""
        self.s: requests.Session = session

    def _get(
        self,
        url: str,
        params: Optional[dict[str, Optional[str]]] = None,
        headers: Optional[dict[str, str]] = None,
        stream: Optional[bool] = None,
        **kwargs: Any,
    ) -> requests.Response:
        """Sends a HTTP GET request.

        Pass-through method to requests.sessions.Session.get, also adding to
        the counter of total requests sent by `ci.core`.

        Args:
            url: Request URL
            params: Mapping to be sent in the query string for the request
            headers: Mapping of HTTP Headers
            stream: Whether to stream download the response content.
            kwargs: Optional arguments to requests.sessions.Session.get

        Returns:
            requests.Response object from executing the request

        Raises:
            requests.exceptions.RequestException

        """
        Settings.total_requests += 1
        return self.s.get(url, params=params, headers=headers, stream=stream, **kwargs)

    def _post(
        self,
        url: str,
        data: Optional[Mapping[str, Any]] = None,
        json: Optional[Any] = None,
        **kwargs: Any,
    ) -> requests.Response:
        """Sends a HTTP POST request.

        Pass-through method to requests.sessions.Session.post, also adding to
        the counter of total requests sent by `ci.core`.

        Args:
            url: Request URL
            data: Mapping to be sent in the query string for the request
            json: Json to send in the request body
            kwargs: Optional arguments to requests.sessions.Session.post

        Returns:
            requests.Response object from executing the request

        Raises:
            requests.exceptions.RequestException

        """
        Settings.total_requests += 1
        return self.s.post(url, data=data, json=json, **kwargs)

    def _update_headers(self, headers: dict[str, str]) -> None:
        """Update common session headers dictionary."""
        self.s.headers.update(headers)


class InterfaceAuthenticated(InterfaceBase):
    def __init__(self, session: requests.Session, member_number: int, role_number: int, jk: str):
        """Constructor for InterfaceAuthenticated."""
        super(InterfaceAuthenticated, self).__init__(session)

        self.cn: int = member_number  # Contact Number
        self.mrn: int = role_number  # Member Role Number
        self.jk: str = jk  # ???? Key?  # Join Key??? SHA2-512
