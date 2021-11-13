from typing import Any

import requests

from compass.core import errors
from compass.core.settings import Settings


class Client(requests.Session):
    """Counts the number of requests sent."""

    def request(self, *args: Any, **kwargs: Any) -> requests.Response:
        Settings.total_requests += 1
        try:
            return super().request(*args, **kwargs)
        except requests.RequestException as err:
            raise errors.CompassNetworkError("Network Error!") from err
