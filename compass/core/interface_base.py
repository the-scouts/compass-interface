from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from compass.core.util import counting_session


class InterfaceBase:
    """Base class for interacting with the Compass server."""

    def __init__(self, session: counting_session.CountingSession):
        """Constructor for InterfaceBase."""
        self.s: counting_session.CountingSession = session
