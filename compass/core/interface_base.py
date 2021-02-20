from __future__ import annotations

from typing import Any, Optional, TYPE_CHECKING, Union

from compass.core.settings import Settings

if TYPE_CHECKING:
    from collections.abc import Mapping
    from collections.abc import MutableMapping

    import requests


class InterfaceBase:
    """Base class for interacting with the Compass server."""

    def __init__(self, session: requests.Session):
        """Constructor for InterfaceBase."""
        self.s: requests.Session = session

    def _get(
        self,
        url: Union[str, bytes],
        params: Optional[MutableMapping[str, str]] = None,
        headers: Optional[MutableMapping[str, str]] = None,
        stream: Optional[bool] = None,
        **kwargs: Any,
    ) -> requests.Response:
        Settings.total_requests += 1
        return self.s.get(url, params=params, headers=headers, stream=stream, **kwargs)

    def _post(
        self,
        url: str,
        data: Union[None, str, bytes, Mapping[str, Any]] = None,
        json: Optional[Any] = None,
        **kwargs: Any,
    ) -> requests.Response:
        Settings.total_requests += 1
        return self.s.post(url, data=data, json=json, **kwargs)

    def _head(self, url: str, **kwargs: Any) -> requests.Response:
        Settings.total_requests += 1
        return self.s.head(url, **kwargs)

    def _update_headers(self, headers: dict[str, str]) -> None:
        self.s.headers.update(headers)
