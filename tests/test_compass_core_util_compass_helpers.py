import hypothesis
import hypothesis.strategies as st

from compass.core.util import compass_helpers


class TestCompassHelpers:
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

    @hypothesis.given(st.dictionaries(st.text(), st.none() | st.booleans() | st.floats() | st.integers() | st.text()), st.none())
    @hypothesis.example(
        data={"a": 1, "b": 2, "c": 3},
        expected=[{"Key": "a", "Value": "1"}, {"Key": "b", "Value": "2"}, {"Key": "c", "Value": "3"}],
    )
    def test_compass_restify(self, data, expected):
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
        if expected is not None:
            assert result == expected
