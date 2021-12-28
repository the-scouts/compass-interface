import ctypes
import functools
from typing import Any


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
