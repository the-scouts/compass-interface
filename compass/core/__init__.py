"""Compass Interface - Core!

This module exposes the public api for CI core
"""
from compass.core import errors
from compass.core import logger
from compass.core.hierarchy import Hierarchy
from compass.core.logon import login
from compass.core.people import People
from compass.core.reports import Reports

__all__ = (
    # sub-packages: CI-Core
    "errors",
    "logger",
    # public classes
    "Hierarchy",
    "People",
    "Reports",
    # public functions
    "login",
)
