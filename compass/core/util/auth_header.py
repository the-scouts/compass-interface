from __future__ import annotations

import datetime
import time
from typing import Any, Optional, TYPE_CHECKING

from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core.util.compass_helpers import compass_restify

if TYPE_CHECKING:
    from collections.abc import Mapping

    import requests

    from compass.core.util.client import Client  # pylint: disable=ungrouped-imports

TYPE_AUTH_IDS = tuple[int, int, str]


def jk_hash(client: Client, membership_number: int, role_number: int, jk: str) -> str:
    """Generate JK Hash needed by Compass."""
    # hash_code(f"{time.time() * 1000:.0f}")
    key_hash = f"{time.time() * 1000:.0f}{jk}{role_number}{membership_number}"  # JK, MRN & CN are all required.
    data = compass_restify({"pKeyHash": key_hash, "pCN": membership_number})
    logger.debug(f"Sending preflight data {datetime.datetime.now()}")
    client.post(f"{Settings.base_url}/System/Preflight", json=data)
    Settings.total_requests += 1
    return key_hash


def auth_header_get(
    auth_ids: TYPE_AUTH_IDS,
    client: Client,
    url: str,
    *,
    params: Optional[Mapping[str, Optional[str]]] = None,
    headers: Optional[Mapping[str, str]] = None,
    stream: Optional[bool] = None,
    **kwargs: Any,
) -> requests.Response:
    """Sends a HTTP GET request.

    Pass-through method to requests.sessions.Session.get, also adding to
    the counter of total requests sent by `compass.core`.

    Adds custom auth_header.py logic for certain Compass requests
    See Scouts.js -> $.ajaxSetup -> beforeSend for details (links below)
    https://github.com/the-scouts/compass-interface/blob/master/js/Scouts.js#L1122
    https://github.com/the-scouts/compass-interface/blob/master/js/Scouts.js#L1128-L1129

    Logic in source comments is auth_header.py logic is only added for **AJAX**
    GET calls matching the following logic:

    if method == "GET":
        if compass_props.master.sys.safe_json is True and "system/preflight" not in url:
            return True
        elif url.lower().replace(Settings.web_service_path.lower(), "").startswith("sto_check")
            return False
        return True

    Args:
        auth_ids:
            Three-tuple of Current authenticated user's membership number,
            active role number, and 'jk' (Ideas: Join Key??? SHA2-512 like)
        client: HTTP client
        url: Request URL
        params: Mapping to be sent in the query string for the request
        headers: Mapping of HTTP Headers
        stream: Whether to stream download the response content.
        kwargs: Optional arguments to session.get

    Returns:
        requests.Response object from executing the request

    Raises:
        CompassNetworkError

    """
    # pylint: disable=too-many-arguments
    # pylint complains that we have more than 5 arguments.
    membership_number, role_number, jk = auth_ids
    headers = dict(headers or {}) | {"Auth": jk_hash(client, membership_number, role_number, jk)}

    params = dict(params or {}) | {
        "x1": f"{membership_number}",
        "x2": f"{jk}",
        "x3": f"{role_number}",
    }

    return client.get(url, params=params, headers=headers, stream=stream, **kwargs)
