import functools
import threading
from pathlib import Path

PROJECT_ROOT = Path(__file__).absolute().parent.parent


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
