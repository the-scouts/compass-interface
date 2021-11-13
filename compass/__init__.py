"""Compass Interface - Core!

This module exposes the public api for CI core
"""

# This directory is a Python package.
from typing import Optional

from compass import hierarchy
from compass import logging
from compass import people
from compass import reports
from compass import schemas  # TODO what schemas are should/need to be public?
from compass import settings
from compass import utility
from compass.errors import CompassAuthenticationError
from compass.errors import CompassError
from compass.hierarchy import Hierarchy
from compass.logon import Logon
from compass.people import People

__all__ = (
    "CompassAuthenticationError",
    "CompassError",
    "hierarchy",
    "Hierarchy",
    "logging",
    "Logon",
    "logon",
    "people",
    "People",
    "reports",
    "schemas",
    "settings",
    "utility",
)


def logon(username: str, password: str, compass_role: Optional[str] = None) -> Logon:
    """Log in to compass, return a compass.logon.Logon object.

    This function is provided as a convenient interface to the logon module.
    """
    return Logon((username, password), compass_role)
