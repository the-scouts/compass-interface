import datetime

import pytest

from compass.core import utility


class TestUtility:
    def test_hash_code(self):
        # Given
        pass

        # When
        hash_code = utility.hash_code("testing")

        # Then
        assert isinstance(hash_code, int)
        # TODO Aim for property based aspects instead of fixed values!
        assert hash_code == -1422446064  # TODO max/min = +/- 2**32?

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
        with pytest.raises(ValueError):
            # When
            utility.parse(data)

    def test_parse_empty(self):
        # Given
        data = ""

        # When
        result = utility.parse(data)

        # Then
        assert result is None
