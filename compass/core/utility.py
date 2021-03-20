from __future__ import annotations

import contextlib
import ctypes
import datetime
import functools
import time
from typing import Any, Optional, TYPE_CHECKING

import pydantic
import requests

from compass.core.logger import logger
from compass.core.settings import Settings

if TYPE_CHECKING:
    from collections.abc import Iterator
    from collections.abc import Mapping


def hash_code(text: str) -> int:
    """Implements Java's hashCode in Python.

    Ref: https://stackoverflow.com/a/8831937
    """
    return functools.reduce(lambda code, char: ctypes.c_int32(31 * code + ord(char)).value, list(text), 0)


def compass_restify(data: dict[str, Any]) -> list[dict[str, str]]:
    """Format a dictionary of key-value pairs into the correct format for Compass.

    It seems that JSON data MUST be in the rather odd format of {"Key": key, "Value": value} for each (key, value) pair.
    """
    return [{"Key": f"{k}", "Value": f"{v}"} for k, v in data.items()]


def maybe_int(value: Any) -> Optional[int]:
    """Casts value to int or None."""
    try:
        return int(value)
    except ValueError:
        return None


def parse(date_time_str: str) -> Optional[datetime.date]:
    if not date_time_str:
        return None
    try:
        return datetime.datetime.strptime(date_time_str, "%d %B %Y").date()  # e.g. 01 January 2000
    except ValueError:
        return datetime.datetime.strptime(date_time_str, "%d %b %Y").date()  # e.g. 01 Jan 2000


@contextlib.contextmanager
def filesystem_guard(msg: str) -> Iterator[None]:
    try:
        yield
    except IOError as err:
        logger.error(f"{msg}: {err.errno} - {err.strerror}")


@contextlib.contextmanager
def validation_errors_logging(id_value: int, name: str = "Member No") -> Iterator[None]:
    try:
        yield
    except pydantic.ValidationError as err:
        logger.exception(f"Parsing Error! {name}: {id_value}")
        if Settings.validation_errors is True:
            raise err


# class PeriodicTimer:
#     def __init__(self, interval: float, callback: Callable[..., Any]):
#         """Constructor for PeriodicTimer."""
#         self.interval = interval
#
#         @functools.wraps(callback)
#         def wrapper(*args: Any, **kwargs: Any) -> None:
#             result = callback(*args, **kwargs)
#             if result is not None:
#                 self.thread = threading.Timer(self.interval, self.callback)
#                 self.thread.start()
#
#         self.callback = wrapper
#         self.thread: threading.Timer = threading.Timer(0.0, self.callback)
#
#     def start(self) -> "PeriodicTimer":
#         self.thread.start()
#         return self
#
#     def cancel(self) -> "PeriodicTimer":
#         self.thread.cancel()
#         return self


def jk_hash(session: requests.Session, membership_number: int, role_number: int, jk: str) -> str:
    """Generate JK Hash needed by Compass."""
    # hash_code(f"{time.time() * 1000:.0f}")
    key_hash = f"{time.time() * 1000:.0f}{jk}{role_number}{membership_number}"  # JK, MRN & CN are all required.
    data = compass_restify({"pKeyHash": key_hash, "pCN": membership_number})
    logger.debug(f"Sending preflight data {datetime.datetime.now()}")
    session.post(f"{Settings.base_url}/System/Preflight", json=data)
    Settings.total_requests += 1
    return key_hash


def auth_header_get(
    membership_number: int,
    role_number: int,
    jk: str,
    session: requests.Session,
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
        membership_number: Current authenticated user's membership number
        role_number: Current authenticated user's active role number
        jk: Current authenticated user's ??? (Ideas: Join Key??? SHA2-512)
        session: Active session, initialised by compass.core.Logon
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
    # pylint: disable=too-many-arguments
    # pylint complains that we have more than 5 arguments.
    headers = dict(headers or {}) | {"Auth": jk_hash(session, membership_number, role_number, jk)}

    params = dict(params or {}) | {
        "x1": f"{membership_number}",
        "x2": f"{jk}",
        "x3": f"{role_number}",
    }

    return session.get(url, params=params, headers=headers, stream=stream, **kwargs)


class CountingSession(requests.Session):
    """Counts the number of requests sent."""

    def request(self, *args: Any, **kwargs: Any) -> requests.Response:
        Settings.total_requests += 1
        return super().request(*args, **kwargs)


#
# def set_interval(interval: int):
#     def decorator(function: Callable):
#         def wrapper(*args, **kwargs):
#             stopped = threading.Event()
#
#             def loop():  # executed in another thread
#                 while not stopped.wait(interval):  # until stopped
#                     function(*args, **kwargs)
#
#             t = threading.Thread(target=loop)
#             t.daemon = True  # stop if the program exits
#             t.start()
#             return stopped
#         return wrapper
#     return decorator
#
#
# import asyncio
#
#
# async def periodic(n):
#     print('periodic')  # run immediately
#     while await asyncio.sleep(n, result=True):
#         print('periodic')
#
# loop = asyncio.get_event_loop()
# task = loop.create_task(periodic(0.5))
# loop.call_later(5, task.cancel)
# with contextlib.suppress(asyncio.CancelledError):
#     loop.run_until_complete(task)
#
#
# # wrapper:
# def periodic(period: int):
#     def scheduler(function: Callable):
#         async def wrapper(*args, **kwargs):
#             asyncio.create_task(function(*args, **kwargs))  # run immediately
#             while await asyncio.sleep(period, result=True):
#                 asyncio.create_task(function(*args, **kwargs))
#         return wrapper
#     return scheduler
