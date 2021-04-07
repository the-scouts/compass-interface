# from __future__ import annotations
#
# import asyncio
# import contextlib
# import functools
# import threading
# from typing import Any, TYPE_CHECKING
#
# if TYPE_CHECKING:
#     from collections.abc import Callable
#
#
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
