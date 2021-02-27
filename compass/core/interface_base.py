from __future__ import annotations

import abc
import datetime
import time
from typing import Any, Optional, TYPE_CHECKING, Union

from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core.utility import compass_restify

if TYPE_CHECKING:
    from collections.abc import Mapping
    from collections.abc import MutableMapping

    import requests


class InterfaceBase:
    """Base class for interacting with the Compass server."""

    def __init__(self, session: requests.Session):
        """Constructor for InterfaceBase."""
        self.s: requests.Session = session

    def _get(
        self,
        url: Union[str, bytes],
        params: Optional[MutableMapping[str, str]] = None,
        headers: Optional[MutableMapping[str, str]] = None,
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

    def _head(self, url: str, **kwargs: Any) -> requests.Response:
        """Sends a HTTP HEAD request.

        Pass-through method to requests.sessions.Session.head, also adding to
        the counter of total requests sent by `ci.core`.

        Args:
            url: Request URL
            kwargs: Optional arguments to requests.sessions.Session.post

        Returns:
            requests.Response object from executing the request

        Raises:
            requests.exceptions.RequestException

        """
        Settings.total_requests += 1
        return self.s.head(url, **kwargs)

    def _update_headers(self, headers: dict[str, str]) -> None:
        """Update common session headers dictionary."""
        self.s.headers.update(headers)


class InterfaceAuthenticated(InterfaceBase, abc.ABC):
    def __init__(self, session: requests.Session, member_number: int, role_number: int, jk: str):
        """Constructor for InterfaceAuthenticated."""
        super(InterfaceAuthenticated, self).__init__(session)

        self.cn: int = member_number  # Contact Number
        self.mrn: int = role_number  # Member Role Number
        self.jk: str = jk  # ???? Key?  # Join Key??? SHA2-512

    def _get(
        self,
        url: str,
        params: Union[None, dict[str, str]] = None,
        headers: Optional[dict[str, str]] = None,
        stream: Optional[bool] = None,
        auth_header: bool = False,
        **kwargs: Any,
    ) -> requests.Response:
        """Sends a HTTP GET request.

        Pass-through method to requests.sessions.Session.get, also adding to
        the counter of total requests sent by `ci.core`.

        Adds custom auth_header logic for certain Compass requests
        See Scouts.js -> $.ajaxSetup -> beforeSend for details (links below)
        https://github.com/the-scouts/compass-interface/blob/master/js/Scouts.js#L1122
        https://github.com/the-scouts/compass-interface/blob/master/js/Scouts.js#L1128-L1129

        Logic in source comments is auth_header logic is only added for **AJAX**
        GET calls matching the following logic:

        if method == "GET":
            if compass_props.master.sys.safe_json is True and "system/preflight" not in url:
                return True
            elif url.lower().replace(Settings.web_service_path.lower(), "").startswith("sto_check")
                return False
            return True

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
        # pylint: disable=arguments-differ, too-many-arguments
        # We override the base requests.get with the custom auth logic, but
        # pylint complains that arguments differ. Also complains that we have
        # more than 5 arguments, so turn off that check too.
        if auth_header:
            if headers is None:
                headers = {}
            headers = headers | {"Auth": self._jk_hash()}

            if params is None:
                params = {}
            params = params | {
                "x1": f"{self.cn}",
                "x2": f"{self.jk}",
                "x3": f"{self.mrn}",
            }

        return super()._get(url, params=params, headers=headers, stream=stream, **kwargs)

    def _jk_hash(self) -> str:
        """Generate JK Hash needed by Compass."""
        # hash_code(f"{time.time() * 1000:.0f}")
        member_no = self.cn
        key_hash = f"{time.time() * 1000:.0f}{self.jk}{self.mrn}{member_no}"  # JK, MRN & CN are all required.
        data = compass_restify({"pKeyHash": key_hash, "pCN": member_no})
        logger.debug(f"Sending preflight data {datetime.datetime.now()}")
        self._post(f"{Settings.base_url}/System/Preflight", json=data)
        return key_hash
