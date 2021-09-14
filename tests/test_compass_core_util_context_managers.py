from __future__ import annotations

from typing import TYPE_CHECKING

import pydantic
import pytest

from compass.core.settings import Settings
from compass.core.util import context_managers

if TYPE_CHECKING:
    import pathlib


class TestContextManagers:
    def test_filesystem_guard_file(self, tmp_path: pathlib.Path):
        # Given some file (with text)
        filename = tmp_path / "existent.txt"
        test_text = "test-text"
        filename.write_text(test_text, encoding="utf-8")

        # When we read the file with filesystem_guard
        with context_managers.filesystem_guard("message (test_filesystem_guard_file)"):
            out = filename.read_text(encoding="utf-8")

        # Then check filesystem_guard hasn't mutated the text
        assert test_text == out

    def test_filesystem_guard_no_file(self, tmp_path: pathlib.Path, caplog: pytest.LogCaptureFixture):
        # Given some file (doesn't exist)
        filename = tmp_path / "non-existent.txt"

        # When we read the file with filesystem_guard
        with context_managers.filesystem_guard("message (test_filesystem_guard_no_file)"):
            filename.read_text(encoding="utf-8")

        # Then check filesystem_guard hasn't logged the error with the custom message
        assert "message (test_filesystem_guard_no_file)" in caplog.text

    def test_filesystem_guard_chained(self, tmp_path: pathlib.Path):
        # Given some file (with text)
        filename = tmp_path / "chained-with-statements.txt"
        test_text = "test-text"
        filename.write_text(test_text, encoding="utf-8")

        # When we read the file with filesystem_guard with chained `with` statements
        with context_managers.filesystem_guard("message (test_filesystem_guard_file)"), open(filename, "r", encoding="utf-8") as f:
            out = f.read()

        # Then check filesystem_guard hasn't mutated the text
        assert test_text == out

    def test_validation_errors_logging_raise(self, caplog: pytest.LogCaptureFixture):
        # Given
        Settings.validation_errors = True

        class TestModel(pydantic.BaseModel):
            val: int

        # Then
        with pytest.raises(pydantic.ValidationError, match="1 validation error"):
            # When
            with context_managers.validation_errors_logging(28_980, name="ID Number Type"):
                TestModel(val="not an integer")  # type: ignore[arg-type]

        assert caplog.messages[0] == "Parsing Error! ID Number Type: 28980"

    def test_validation_errors_logging_swallow(self, caplog: pytest.LogCaptureFixture):
        # Given
        Settings.validation_errors = False

        class TestModel(pydantic.BaseModel):
            val: int

        # When
        with context_managers.validation_errors_logging(28_980, name="ID Number Type"):
            TestModel(val="not an integer")  # type: ignore[arg-type]

        # Then
        assert caplog.messages[0] == "Parsing Error! ID Number Type: 28980"
        err_type, err_value, traceback = caplog.records[0].exc_info
        assert err_type is pydantic.ValidationError
