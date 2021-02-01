"""Compass Interface - Core!

This module exposes the public api for CI core
"""

# This directory is a Python package.
from typing import Optional

from compass import core
from compass.core import errors
from compass.core import logger
from compass.core.hierarchy import Hierarchy
from compass.core.logon import Logon
from compass.core.people import People
from compass.core.reports import Reports

__all__ = (
    # sub-packages: CI-Core
    "core",
    "errors",
    "logger",
    # public classes
    "Hierarchy",
    "Logon",
    "People",
    "Reports",
    # public functions
    "login",
)


def login(username: str, password: str, compass_role: Optional[str] = None) -> Logon:
    """Log in to compass, return a compass.logon.Logon object.

    This function is provided as a convenient interface to the logon module.
    """
    return Logon((username, password), compass_role)
