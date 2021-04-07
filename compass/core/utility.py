from __future__ import annotations

import contextlib
from typing import TYPE_CHECKING

import pydantic

from compass.core.logger import logger
from compass.core.settings import Settings

if TYPE_CHECKING:
    from collections.abc import Iterator


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
