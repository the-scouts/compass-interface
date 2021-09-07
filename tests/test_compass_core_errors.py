import pytest

import compass.core as ci


class TestErrors:
    def test_compass_error(self):
        # Given
        data = "message"

        # Then
        with pytest.raises(ci.CompassError, match=data):
            # When
            raise ci.CompassError(data)

    def test_compass_authentication_error(self):
        # Given
        data = "message"

        # Then
        with pytest.raises(ci.CompassAuthenticationError, match=data):
            # When
            raise ci.CompassAuthenticationError(data)

    def test_compass_permission_error(self):
        # Given
        data = "message"

        # Then
        with pytest.raises(ci.CompassPermissionError, match=data):
            # When
            raise ci.CompassPermissionError(data)

    def test_compass_report_error(self):
        # Given
        data = "message"

        # Then
        with pytest.raises(ci.CompassReportError, match=data):
            # When
            raise ci.CompassReportError(data)

    def test_compass_report_permission_error(self):
        # Given
        data = "message"

        # Then
        with pytest.raises(ci.CompassReportPermissionError, match=data):
            # When
            raise ci.CompassReportPermissionError(data)

    def test_compass_authentication_error_inheritance(self):
        # Given
        data = "message"

        # When
        try:
            raise ci.CompassAuthenticationError(data)
        # Then
        except ci.CompassError as err:
            assert str(err) == data

    def test_compass_permission_error_inheritance(self):
        # Given
        data = "message"

        # When
        try:
            raise ci.CompassPermissionError(data)
        # Then
        except ci.CompassError as err:
            assert str(err) == data

    def test_compass_report_error_inheritance(self):
        # Given
        data = "message"

        # When
        try:
            raise ci.CompassReportError(data)
        # Then
        except ci.CompassError as err:
            assert str(err) == data

    def test_compass_report_permission_error_inheritance(self):
        # Given
        data = "message"

        # Dual inheritance:

        # When
        try:
            raise ci.CompassReportPermissionError(data)
        # Then
        except ci.CompassReportError as err:
            assert str(err) == data

        # When
        try:
            raise ci.CompassReportPermissionError(data)
        # Then
        except ci.CompassPermissionError as err:
            assert str(err) == data

        # When
        try:
            raise ci.CompassReportPermissionError(data)
        # Then
        except ci.CompassError as err:
            assert str(err) == data
