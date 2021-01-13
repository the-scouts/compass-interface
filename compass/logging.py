import logging

logger = logging.getLogger("compass_interface")


def _add_debug_handler() -> None:
    import sys

    logger.setLevel(logging.DEBUG)
    logger.addHandler(logging.StreamHandler(stream=sys.stdout))
