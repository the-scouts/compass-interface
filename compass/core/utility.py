import ast
import contextlib
import ctypes
import datetime
import functools
import threading
from typing import Any, Optional, Union

from compass.core.logger import logger


def hash_code(text: str) -> int:
    """Implements Java's hashCode in Python.

    Ref: https://stackoverflow.com/a/8831937
    """
    return functools.reduce(lambda code, char: ctypes.c_int32(31 * code + ord(char)).value, list(text), 0)


def compass_restify(data: dict) -> list:
    """Format a dictionary of key-value pairs into the correct format for Compass.

    It seems that JSON data MUST be in the rather odd format of {"Key": key, "Value": value} for each (key, value) pair.
    """
    return [{"Key": f"{k}", "Value": f"{v}"} for k, v in data.items()]


def cast(value, ast_eval: bool = False) -> Union[int, str, Any]:
    """Casts values to native Python types.

    lxml ETree return types don't do this automatically, and by using
    ast.literal_eval we can directly map string representations of
    lists etc into native types.
    """
    try:
        return int(value)
    except (ValueError, TypeError):
        if not ast_eval:
            return str(value)
        try:
            return ast.literal_eval(str(value)) if value else value
        except (ValueError, TypeError, SyntaxError):
            return value


def maybe_int(value) -> Optional[int]:
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


class PeriodicTimer:
    def __init__(self, interval, callback):
        """Constructor for PeriodicTimer."""
        self.thread = None
        self.interval = interval

        @functools.wraps(callback)
        def wrapper(*args, **kwargs):
            result = callback(*args, **kwargs)
            if result is not None:
                self.thread = threading.Timer(self.interval, self.callback)
                self.thread.start()

        self.callback = wrapper

    def start(self):
        self.thread = threading.Thread(target=self.callback)
        self.thread.start()
        return self

    def cancel(self):
        self.thread.cancel()
        return self
