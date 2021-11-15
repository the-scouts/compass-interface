"""Compass Interface - Core!

This module exposes the public api for CI core
"""
from compass.core.__version__ import __version__
from compass.core.__version__ import __version_info__

from compass.core.interface import login
from compass.core.logger import enable_debug_logging

__all__ = (
    # public metadata
    "__version__",
    "__version_info__",
    # public functions
    "enable_debug_logging",
    "login",
)
