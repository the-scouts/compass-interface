import pytest

import compass.core as ci
from compass.core.util import client


class TestClient:
    def test_custom_error(self):
        # assume underlying client is tested by library -- only test what we add
        # Given
        session = client.Client()

        # Then
        with pytest.raises(ci.CompassNetworkError):
            # When
            session.get("https://httpbin.org/delay/5", timeout=0.5)
