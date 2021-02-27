import contextlib
import ctypes
import datetime
import functools
import threading
from typing import Any, Callable, Optional

import pydantic

from compass.core.logger import logger


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


def parse(date_time_str: str) -> Optional[datetime.datetime]:
    if not date_time_str:
        return None
    else:
        try:
            return datetime.datetime.strptime(date_time_str, "%d %B %Y")  # e.g. 01 January 2000
        except ValueError:
            return datetime.datetime.strptime(date_time_str, "%d %b %Y")  # e.g. 01 Jan 2000


@contextlib.contextmanager
def filesystem_guard(msg: str):
    try:
        yield
    except IOError as err:
        logger.error(f"{msg}: {err.errno} - {err.strerror}")


@contextlib.contextmanager
def validation_errors_logging(id_value: int, name: str = "Member No"):
    try:
        yield
    except pydantic.ValidationError as err:
        logger.error(f"Parsing Error! {name}: {id_value}")
        raise err


class PeriodicTimer:
    def __init__(self, interval: float, callback: Callable[..., Any]):
        """Constructor for PeriodicTimer."""
        self.interval = interval

        @functools.wraps(callback)
        def wrapper(*args: Any, **kwargs: Any) -> None:
            result = callback(*args, **kwargs)
            if result is not None:
                self.thread = threading.Timer(self.interval, self.callback)
                self.thread.start()

        self.callback = wrapper
        self.thread: threading.Timer = threading.Timer(0.0, self.callback)

    def start(self) -> "PeriodicTimer":
        self.thread.start()
        return self

    def cancel(self) -> "PeriodicTimer":
        self.thread.cancel()
        return self


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
