from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import requests


class InterfaceBase:
    """Base class for interacting with the Compass server."""

    def __init__(self, session: requests.Session):
        """Constructor for InterfaceBase."""
        self.s: requests.Session = session
