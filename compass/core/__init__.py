"""Compass Interface - Core!

This module exposes the public api for CI core
"""
from __future__ import annotations

from compass.core import errors
from compass.core import logger
from compass.core.hierarchy import Hierarchy
from compass.core.logon import Logon
from compass.core.people import People
from compass.core.reports import Reports


class CompassInterface:
    def __init__(self, user_props: Logon, /):
        """This is the main (programmatic) interface to CI core."""
        self._user_props = user_props
        self.people = People(user_props)
        self.hierarchy = Hierarchy(user_props)
        self.reports = Reports(user_props)


def login(username: str, password: str, /, *, role: str | None = None, location: str | None = None) -> CompassInterface:
    """Log in to compass, return a compass.logon.Logon object.

    This function is provided as a convenient interface to the logon module.
    """
    return CompassInterface(Logon.from_logon((username, password), role, location))


__all__ = (
    # sub-packages: CI-Core
    "errors",
    "logger",
    # public classes
    "CompassInterface",
    "Logon",
    "Hierarchy",
    "People",
    "Reports",
    # public functions
    "login",
)
