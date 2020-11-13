import ast
import ctypes
import functools
import threading

from pathlib import Path

# https://stackoverflow.com/a/8831937
def hash_code(text: str) -> int:
    """Implements Java's hashCode in python"""
    return functools.reduce(lambda code, char: ctypes.c_int32(31 * code + ord(char)).value, list(text), 0)


def compass_restify(data: dict) -> list:
    # JSON data MUST be in the rather odd format of {"Key": key, "Value": value} for each (key, value) pair
    return [{"Key": f"{k}", "Value": f"{v}"} for k, v in data.items()]


def cast(value):
    try:
        value = int(value)
    except (ValueError, TypeError):
        try:
            value = ast.literal_eval(str(value)) if value else value
        except (ValueError, TypeError, SyntaxError):
            pass
    return value


class PeriodicTimer:
    def __init__(self, interval, callback):
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

    def cancel(self):
        self.thread.cancel()
