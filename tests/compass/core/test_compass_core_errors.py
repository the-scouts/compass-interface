import pytest

from compass.core import errors


class TestErrors:
    def test_compass_error(self):
        # Given
        data = "message"

        # Then
        with pytest.raises(errors.CompassError, match=data):
            # When
            raise errors.CompassError(data)

    def test_compass_authentication_error(self):
        # Given
        data = "message"

        # Then
        with pytest.raises(errors.CompassAuthenticationError, match=data):
            # When
            raise errors.CompassAuthenticationError(data)

    def test_compass_report_error(self):
        # Given
        data = "message"

        # Then
        with pytest.raises(errors.CompassReportError, match=data):
            # When
            raise errors.CompassReportError(data)

    def test_compass_report_permission_error(self):
        # Given
        data = "message"

        # Then
        with pytest.raises(errors.CompassReportPermissionError, match=data):
            # When
            raise errors.CompassReportPermissionError(data)

    def test_compass_authentication_error_inheritance(self):
        # Given
        data = "message"

        # When
        try:
            raise errors.CompassAuthenticationError(data)
        # Then
        except errors.CompassError as err:
            assert str(err) == data

    def test_compass_report_error_inheritance(self):
        # Given
        data = "message"

        # When
        try:
            raise errors.CompassReportError(data)
        # Then
        except errors.CompassError as err:
            assert str(err) == data

    def test_compass_report_permission_error_inheritance(self):
        # Given
        data = "message"

        # Dual inheritance:

        # When
        try:
            raise errors.CompassReportPermissionError(data)
        # Then
        except PermissionError as err:
            assert str(err) == data

        # When
        try:
            raise errors.CompassReportPermissionError(data)
        # Then
        except errors.CompassError as err:
            assert str(err) == data
