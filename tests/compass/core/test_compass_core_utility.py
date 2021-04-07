from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import hypothesis
import hypothesis.strategies as st
import pytest

from compass.core.util import compass_helpers
from compass.core.util import context_managers
from compass.core.util import type_coercion

if TYPE_CHECKING:
    import pathlib


class TestUtility:
    def test_hash_code(self):
        # Given
        data = "testing"

        # When
        result = compass_helpers.hash_code(data)

        # Then
        assert isinstance(result, int)
        assert result == -1422446064

    @hypothesis.given(st.text())
    def test_hash_code_range(self, data):
        # Given data from hypothesis, When
        result = compass_helpers.hash_code(data)

        # Then
        assert isinstance(result, int)
        assert -2_147_483_648 <= result <= 2_147_483_647  # -2**31 to 2**31-1

    def test_compass_restify(self):
        # Given
        data = {"a": 1, "b": 2, "c": 3}

        # When
        result = compass_helpers.compass_restify(data)

        # Then
        assert result == [{"Key": "a", "Value": "1"}, {"Key": "b", "Value": "2"}, {"Key": "c", "Value": "3"}]

    @hypothesis.given(st.dictionaries(st.text(), (st.none() | st.booleans() | st.floats() | st.integers() | st.text())))
    def test_compass_restify2(self, data):
        # Given data from hypothesis
        size = len(data)

        # When
        result = compass_helpers.compass_restify(data)

        # Then
        assert isinstance(result, list)
        assert len(result) == size
        for pair in result:
            assert isinstance(pair, dict)
            assert len(pair) == 2
            assert pair.keys() == {"Key", "Value"}
            for val in pair.values():
                assert isinstance(val, str)

    def test_maybe_int_int(self):
        # Given
        data = 123

        # When
        result = type_coercion.maybe_int(data)
        result_str = type_coercion.maybe_int(str(data))

        # Then
        assert result == data
        assert result_str == data

    def test_maybe_int_str(self):
        # Given
        data = "abc"

        # When
        result = type_coercion.maybe_int(data)

        # Then
        assert result is None

    def test_parse_month_short(self):
        # Given
        data = "01 Jan 2000"

        # When
        result = type_coercion.parse(data)

        # Then
        assert isinstance(result, datetime.date)
        assert result == datetime.date(2000, 1, 1)

    def test_parse_month_long(self):
        # Given
        data = "01 January 2000"

        # When
        result = type_coercion.parse(data)

        # Then
        assert isinstance(result, datetime.date)
        assert result == datetime.date(2000, 1, 1)

    def test_parse_non_date(self):
        # Given
        data = "abc"

        # Then
        with pytest.raises(ValueError, match=f"time data '{data}' does not match format '%d %b %Y'"):
            # When
            type_coercion.parse(data)

    def test_parse_empty(self):
        # Given
        data = ""

        # When
        result = type_coercion.parse(data)

        # Then
        assert result is None

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
