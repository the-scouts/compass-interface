import httpx
import pytest

import compass.core as ci
from compass.core._scrapers import reports
from compass.core.settings import Settings

base_url = "http://127.0.0.1:4200"


class TestReports:
    def test_report_number(self):
        # Given
        report_type = "Awards Report"
        hierarchy_level = "District"

        # When
        out = reports._report_number(report_type, hierarchy_level)

        # Then
        assert out == 94

    def test_report_number_invalid_type(self):
        # Given
        report_type = "Youth Members Report"
        hierarchy_level = "District"

        # Then
        with pytest.raises(ci.CompassReportError, match="Youth Members Report is not a valid report type"):
            # When
            reports._report_number(report_type, hierarchy_level)

    def test_report_number_invalid_level(self):
        # Given
        report_type = "Awards Report"
        hierarchy_level = "Group"

        # Then
        with pytest.raises(ci.CompassReportError, match="Requested report does not exist for hierarchy level: Group."):
            # When
            reports._report_number(report_type, hierarchy_level)

    def test_extract_form_data(self):
        # TODO -- lxml
        pass

    def test_form_data_appointments(self):
        # TODO -- lxml
        pass

    def test_parse_drop_down_list(self):
        # TODO -- lxml
        pass

    def test_extract_report_export_url_base(self):
        # Given
        Settings.base_url = base_url
        haystack = """Lorem ipsum dolor sit amet, "ExportUrlBase":"run-report-export" consectetur adipiscing elit. Phasellus """

        # When
        out = reports._extract_report_export_url_base(haystack)

        # Then
        assert out == "http://127.0.0.1:4200/run-report-export"

        # TODO test unhappy path, unicode escape stuff

    def test_error_status(self):
        # Given
        transport = httpx.MockTransport(lambda _: httpx.Response(500))
        client = httpx.Client(transport=transport)

        # When
        response = client.get("http://a-uri-that-returns-an-error-status")

        # Then
        with pytest.raises(ci.CompassNetworkError, match="Request to Compass failed!"):
            reports._error_status(response)
