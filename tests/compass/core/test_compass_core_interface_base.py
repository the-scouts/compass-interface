import requests

from compass.core.interface_base import InterfaceBase


class TestInterfaceBase:
    def test_init(self):
        # Given
        s = requests.Session()

        # When
        result = InterfaceBase(s)

        # Then
        assert result.s is s
