import datetime
import enum
from typing import Literal

from compass.core import errors
from compass.core._scrapers.reports import ReportsScraper
from compass.core.logger import logger
from compass.core.logon import Logon
from compass.core.settings import Settings

TYPES_REPORTS = Literal[
    "Region Member Directory",
    "Region Appointments Report",
    "Region Permit Report",
    "Region Disclosure Report",
    "Region Training Report",
    "Region Disclosure Management Report",
]


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
        self._scraper = ReportsScraper(session._session, session.membership_number, session.role_number, session._jk)
        self.current_role: tuple[str, str] = session.current_role

        self.membership_number = session.membership_number
        self.role_number = session.role_number

    def get_report(self, report_type: TYPES_REPORTS) -> bytes:
        """Exports report as CSV from Compass.

        Exporting a report is of course surprisingly complicated. The process
        has four major steps, as follows:

        1. Get a token for generating the report from the Compass backend. This
            also validates that the report exists and that the user is
            authenticated to access it.
        2. If successful in obtaining a report token, get the initial report
            page. The token is the (relative) URL here, and the report page
            contains further needed information, such as the export URL and
            location data for a full export.
            (Compass does not include all organisational units in reports by
            default, and to export all data for a given unit and downwards, we
            need to add in these missing/unset levels manually).
        3. We update report configuration data (sent as form data), and check
            that we are not in an error state.
        4. We extract the export URL, download the content and save to disk.

        Pitfalls to be aware of in this process include that:
        - Compass checks user-agent headers in some parts of the process
            (TODO pinpoint which exactly)
        - There is a ten (10) minute default soft-timeout, which may run out
            before a report download has finished
        - If a requested report is too large, Compass can simply give up, often
            with an `OutOfMemory` error or similar

        Returns:
            Report output, as a bytes-encoded object.

        Raises:
            CompassReportError:
                - If the user passes an invalid report type
                - If Compass returns a JSON error
                - If there is an error updating the form data
            CompassReportPermissionError:
                If the user does not have permission to run the report
            requests.HTTPError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        # Get token for report type & role running said report:
        try:
            # report_type is given as `Title Case` with spaces, enum keys are in `snake_case`
            rt_key = report_type.lower().replace(" ", "_")
            run_report_url = self._scraper.get_report_token(ReportTypes[rt_key].value, self.role_number)
        except KeyError:
            # enum keys are in `snake_case`, output types as `Title Case` with spaces
            types = [rt.name.title().replace("_", " ") for rt in ReportTypes]
            raise errors.CompassReportError(f"{report_type} is not a valid report type. Valid report types are {types}") from None

        # Get initial reports page, for export URL and config:
        report_page = self._scraper.get_report_page(run_report_url)

        # Update form data & set location selection:
        self._scraper.update_form_data(report_page, f"{Settings.base_url}/{run_report_url}")

        # Export the report:
        logger.info("Exporting report")
        export_url_path, export_url_params = self._scraper.get_report_export_url(report_page.decode("UTF-8"))

        time_string = datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")  # colons are illegal on windows
        filename = f"{time_string} - {self.membership_number} ({' - '.join(self.current_role)}).csv"

        # start = time.time()
        # TODO TRAINING REPORT ETC.
        # # TODO REPORT BODY HAS KEEP ALIVE URL KeepAliveUrl
        # p = PeriodicTimer(15, lambda: self.report_keep_alive(self.session, report_page.text))
        # self.session.sto_thread.start()
        # p.start()
        # # ska_url = self.report_keep_alive(self.session, report_page.text)
        # try:
        #     self.download_report(self.session, f"{Settings.base_url}/{export_url_path}", export_url_params, filename, )  # ska_url
        # except (ConnectionResetError, requests.ConnectionError):
        #     logger.info(f"Stopped at {datetime.datetime.now()}")
        #     p.cancel()
        #     self.session.sto_thread.cancel()
        #     raise
        # logger.debug(f"Exporting took {time.time() -start}s")

        csv_export = self._scraper.download_report_normal(f"{Settings.base_url}/{export_url_path}", export_url_params, filename)

        return csv_export
