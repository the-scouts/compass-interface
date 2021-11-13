import datetime

import pytest

from compass.core.util import type_coercion


class TestTypeCoercion:
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
        result = type_coercion.parse_date(data)

        # Then
        assert isinstance(result, datetime.date)
        assert result == datetime.date(2000, 1, 1)

    def test_parse_month_long(self):
        # Given
        data = "01 January 2000"

        # When
        result = type_coercion.parse_date(data)

        # Then
        assert isinstance(result, datetime.date)
        assert result == datetime.date(2000, 1, 1)

    def test_parse_non_date(self):
        # Given
        data = "abc"

        # Then
        with pytest.raises(ValueError, match=f"Parsing string `{data}` into a date failed!"):
            # When
            type_coercion.parse_date(data)

    def test_parse_empty(self):
        # Given
        data = ""

        # When
        result = type_coercion.parse_date(data)

        # Then
        assert result is None
