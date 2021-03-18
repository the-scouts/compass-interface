from __future__ import annotations

from typing import Any, Optional, TYPE_CHECKING

from compass.core.settings import Settings

if TYPE_CHECKING:
    from collections.abc import Mapping

    import requests


class InterfaceBase:
    """Base class for interacting with the Compass server."""

    def __init__(self, session: requests.Session):
        """Constructor for InterfaceBase."""
        self.s: requests.Session = session
