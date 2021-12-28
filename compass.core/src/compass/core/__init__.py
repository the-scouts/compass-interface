"""Compass Interface - Core!

This module exposes the public api for CI core
"""
__version__ = "0.27.0"
__version_info__ = (0, 27, 0)

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
