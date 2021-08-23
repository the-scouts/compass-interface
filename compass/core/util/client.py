from typing import Any

import httpx

import compass.core as ci
from compass.core.settings import Settings


class Client(httpx.Client):
    """Counts the number of requests sent."""

    def request(self, *args: Any, **kwargs: Any) -> httpx.Response:
        Settings.total_requests += 1
        try:
            return super().request(*args, **kwargs)
        except httpx.RequestError as err:
            raise ci.CompassNetworkError("Network Error!") from err
