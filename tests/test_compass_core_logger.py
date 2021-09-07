import logging
import pathlib
import sys

from compass.core import logger


class TestLogger:
    def test_enable_debug_logging(self, tmp_path: pathlib.Path):
        # Given
        log_file = tmp_path / "test_log.log"

        # When
        logger.enable_debug_logging(log_file=log_file)

        # Then
        assert logger.logger.level == logging.DEBUG
        assert isinstance(logger.logger.handlers[0], logging.StreamHandler)
        assert isinstance(logger.logger.handlers[1], logging.FileHandler)
        assert logger.logger.handlers[0].stream == sys.stdout
        assert "test_log.log" in logger.logger.handlers[1].baseFilename
