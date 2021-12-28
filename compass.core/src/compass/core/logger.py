from __future__ import annotations

import logging
from typing import Optional, TYPE_CHECKING

from compass.core.settings import Settings

if TYPE_CHECKING:
    from pathlib import Path

logger = logging.getLogger("compass_interface")


def enable_debug_logging(*, log_file: Optional[Path] = None) -> None:
    import sys  # Disable check; only want to import sys if needed. pylint: disable=import-outside-toplevel

    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter(fmt="{asctime}.{msecs:03.0f} ({levelname}): {message}", datefmt="%Y-%m-%d %H:%M:%S", style="{")

    handlers = [logging.StreamHandler(stream=sys.stdout)]  # always include a default console handler
    if log_file is not None:
        handlers.append(logging.FileHandler(log_file.with_suffix(".log"), encoding="utf-8"))

    for handler in handlers:
        handler.setFormatter(formatter)
        logger.addHandler(handler)


if Settings.debug:
    enable_debug_logging(log_file=Settings.log_file)
