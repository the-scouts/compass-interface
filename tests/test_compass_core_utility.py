from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest

from compass.core import utility

if TYPE_CHECKING:
    import pathlib


class TestUtility:
    def test_hash_code(self):
        # Given
        data = "testing"

        # When
        result = utility.hash_code(data)

        # Then
        assert isinstance(result, int)
        # TODO Aim for property based aspects instead of fixed values!
        assert result == -1422446064  # TODO max/min = +/- 2**32?

    def test_compass_restify(self):
        # Given
        data = {"a": 1, "b": 2, "c": 3}
        num_pairs = len(data)

        # When
        result = utility.compass_restify(data)

        # Then
        assert isinstance(result, list)
        assert len(result) == num_pairs
        assert all(item.keys() == {"Key", "Value"} for item in result)
        # TODO Aim for property based aspects instead of fixed values!
        assert result == [{"Key": "a", "Value": "1"}, {"Key": "b", "Value": "2"}, {"Key": "c", "Value": "3"}]

    def test_cast_ast_eval_false_int(self):
        # Given
        data = 123

        # When
        result = utility.cast(data, ast_eval=False)
        result_str = utility.cast(str(data), ast_eval=False)

        # Then
        assert result == data
        assert result_str == data

    def test_cast_ast_eval_false_str(self):
        # Given
        data = "abc"

        # When
        result = utility.cast(data, ast_eval=False)

        # Then
        assert result == data

    def test_cast_ast_eval_false_list(self):
        # Given
        data = [1, 2, 3]

        # When
        result = utility.cast(data, ast_eval=False)
        result_str = utility.cast(str(data), ast_eval=False)

        # Then
        assert result == str(data)
        assert result_str == str(data)

    def test_cast_ast_eval_true_int(self):
        # Given
        data = 123

        # When
        result = utility.cast(data, ast_eval=True)
        result_str = utility.cast(str(data), ast_eval=True)

        # Then
        assert result == data
        assert result_str == data

    def test_cast_ast_eval_true_str(self):
        # Given
        data = "abc"

        # When
        result = utility.cast(data, ast_eval=True)

        # Then
        assert result == data

    def test_cast_ast_eval_true_list(self):
        # Given
        data = [1, 2, 3]

        # When
        result = utility.cast(data, ast_eval=True)
        result_str = utility.cast(str(data), ast_eval=True)

        # Then
        assert result == data
        assert result_str == data

    def test_maybe_int_int(self):
        # Given
        data = 123

        # When
        result = utility.maybe_int(data)
        result_str = utility.cast(str(data))

        # Then
        assert result == data
        assert result_str == data

    def test_maybe_int_str(self):
        # Given
        data = "abc"

        # When
        result = utility.maybe_int(data)

        # Then
        assert result is None

    def test_parse_month_short(self):
        # Given
        data = "01 Jan 2000"

        # When
        result = utility.parse(data)

        # Then
        assert isinstance(result, datetime.datetime)
        assert result == datetime.datetime(2000, 1, 1)

    def test_parse_month_long(self):
        # Given
        data = "01 January 2000"

        # When
        result = utility.parse(data)

        # Then
        assert isinstance(result, datetime.datetime)
        assert result == datetime.datetime(2000, 1, 1)

    def test_parse_non_date(self):
        # Given
        data = "abc"

        # Then
        with pytest.raises(ValueError, match=f"time data '{data}' does not match format '%d %b %Y'"):
            # When
            utility.parse(data)

    def test_parse_empty(self):
        # Given
        data = ""

        # When
        result = utility.parse(data)

        # Then
        assert result is None

    def test_filesystem_guard_file(self, tmp_path: pathlib.Path):
        # Given some file (with text)
        filename = tmp_path / "existent.txt"
        test_text = "test-text"
        filename.write_text(test_text, encoding="utf-8")

        # When we read the file with filesystem_guard
        with utility.filesystem_guard("message (test_filesystem_guard_file)"):
            out = filename.read_text(encoding="utf-8")

        # Then check filesystem_guard hasn't mutated the text
        assert test_text == out

    def test_filesystem_guard_no_file(self, tmp_path: pathlib.Path, caplog: pytest.LogCaptureFixture):
        # Given some file (doesn't exist)
        filename = tmp_path / "non-existent.txt"

        # When we read the file with filesystem_guard
        with utility.filesystem_guard("message (test_filesystem_guard_no_file)"):
            filename.read_text(encoding="utf-8")

        # Then check filesystem_guard hasn't logged the error with the custom message
        assert "message (test_filesystem_guard_no_file)" in caplog.text

    def test_filesystem_guard_chained(self, tmp_path: pathlib.Path):
        # Given some file (with text)
        filename = tmp_path / "chained-with-statements.txt"
        test_text = "test-text"
        filename.write_text(test_text, encoding="utf-8")

        # When we read the file with filesystem_guard with chained `with` statements
        with utility.filesystem_guard("message (test_filesystem_guard_file)"), open(filename, "r", encoding="utf-8") as f:
            out = f.read()

        # Then check filesystem_guard hasn't mutated the text
        assert test_text == out
