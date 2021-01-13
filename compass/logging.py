import logging

logger = logging.getLogger("compass_interface")


def _add_debug_handler() -> None:
    import sys

    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(fmt="{asctime}.{msecs:03.0f} ({levelname}): {message}", datefmt="%Y-%m-%d %H:%M:%S", style="{")
    console = logging.StreamHandler(stream=sys.stdout)
    console.setFormatter(formatter)

    logger.addHandler(console)
