from typing import Any

import requests

from compass.core.settings import Settings


class CountingSession(requests.Session):
    """Counts the number of requests sent."""

    def request(self, *args: Any, **kwargs: Any) -> requests.Response:
        Settings.total_requests += 1
        return super().request(*args, **kwargs)
