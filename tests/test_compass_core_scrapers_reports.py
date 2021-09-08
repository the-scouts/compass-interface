import httpx
import pytest

import compass.core as ci
from compass.core._scrapers import reports


class TestReports:
    def test_error_status(self):
        # Given
        transport = httpx.MockTransport(lambda _: httpx.Response(500))
        client = httpx.Client(transport=transport)

        # When
        response = client.get("http://a-uri-that-returns-an-error-status")

        # Then
        with pytest.raises(ci.CompassNetworkError, match="Request to Compass failed!"):
            reports._error_status(response)
