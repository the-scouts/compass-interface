from urllib.parse import urlparse

import _strptime

from compass.core.settings import Settings


class TestSettings:
    def test_base_url(self):
        # Given
        data = Settings.base_url

        # When
        result = urlparse(data)

        # Then
        assert isinstance(data, str)
        assert bool(result.scheme) and bool(result.hostname)

    def test_date_format(self):
        # Given
        data = Settings.date_format

        # When
        result = _strptime._TimeRE_cache.pattern(data)  # pylint: disable=protected-access

        # Then
        assert isinstance(data, str)
        assert bool(result)

    def test_org_number(self):
        # Given When
        data = Settings.org_number

        # Then
        assert isinstance(data, int)
        assert 0 < data < 100_000_000  # IDs are between 1 and 99,999,999

    def test_wcf_json_endpoint(self):
        # Given When
        data = Settings.wcf_json_endpoint

        assert isinstance(data, str)
        assert data[0] == "/"
        assert ".svc" in data

    def test_web_service_path(self):
        # Given
        data = Settings.web_service_path

        # When
        result = urlparse(data)

        # Then
        assert isinstance(data, str)
        assert bool(result.scheme) and bool(result.hostname) and bool(result.path)
