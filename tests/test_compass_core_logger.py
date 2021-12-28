import logging
import pathlib
import sys

from compass.core.logger import enable_debug_logging
from compass.core.logger import logger


class TestLogger:
    def test_enable_debug_logging(self, tmp_path: pathlib.Path):
        # Given
        log_file = tmp_path / "test_log.log"

        # When
        enable_debug_logging(log_file=log_file)

        # Then
        assert logger.level == logging.DEBUG
        assert isinstance(logger.handlers[0], logging.StreamHandler)
        assert isinstance(logger.handlers[1], logging.FileHandler)
        assert logger.handlers[0].stream == sys.stdout
        assert "test_log.log" in logger.handlers[1].baseFilename
