# pylint: disable=protected-access
from __future__ import annotations

import datetime
import enum

from compass._scrapers.reports import ReportsScraper
from compass.errors import CompassReportError
from compass.errors import CompassReportPermissionError
from compass.logging import logger
from compass.logon import Logon
from compass.settings import Settings


class ReportTypes(enum.IntEnum):
    region_member_directory = 37
    region_appointments_report = 52
    region_permit_report = 72
    region_disclosure_report = 76
    region_training_report = 84
    region_disclosure_management_report = 100


class Reports:
    def __init__(self, session: Logon):
        """Constructor for Reports."""
        self._scraper = ReportsScraper(session.s)
        self._scraper._get = session._get  # massively hacky but we need to send the jk_hash stuff through
        self.session: Logon = session

    def get_report(self, report_type: str) -> bytes:
        # GET Report Page
        # POST Location Update
        # GET CSV data

        # Get token for report type & role running said report:
        try:
            # report_type is given as `Title Case` with spaces, enum keys are in `snake_case`
            run_report_url = self._scraper.get_report_token(ReportTypes[report_type.lower().replace(" ", "_")].value, self.session.mrn)
        except KeyError:
            # enum keys are in `snake_case`, output types as `Title Case` with spaces
            types = [rt.name.title().replace('_', ' ') for rt in ReportTypes]
            raise CompassReportError(f"{report_type} is not a valid report type. Existing report types are {types}") from None

        # Get initial reports page, for export URL and config:
        report_page = self._scraper.get_report_page(run_report_url)

        # Update form data & set location selection:
        self._scraper.update_form_data(report_page, f"{Settings.base_url}/{run_report_url}")

        # Export the report:
        logger.info("Exporting report")
        export_url_path, export_url_params = self._scraper.get_report_export_url(report_page.decode("UTF-8"))

        # TODO Debug check
        time_string = datetime.datetime.now().replace(microsecond=0).isoformat().replace(":", "-")  # colons are illegal on windows
        filename = f"{time_string} - {self.session.cn} ({self.session.current_role}).csv"

        csv_export = self._scraper.download_report_normal(f"{Settings.base_url}/{export_url_path}", export_url_params, filename)

        return csv_export.content
