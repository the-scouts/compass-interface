from compass.core.interface_base import InterfaceBase
from compass.core.util import counting_session


class TestInterfaceBase:
    def test_init(self):
        # Given
        s = counting_session.CountingSession()

        # When
        result = InterfaceBase(s)

        # Then
        assert result.s is s
