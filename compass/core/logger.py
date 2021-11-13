import logging

logger = logging.getLogger("compass_interface")


def enable_debug_logging() -> None:
    import sys  # pylint: disable=import-outside-toplevel

    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(fmt="{asctime}.{msecs:03.0f} ({levelname}): {message}", datefmt="%Y-%m-%d %H:%M:%S", style="{")
    console = logging.StreamHandler(stream=sys.stdout)
    console.setFormatter(formatter)

    logger.addHandler(console)
