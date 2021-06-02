from typing import Literal

import compass.core as ci
from compass.core._scrapers import reports as scraper

TYPES_REPORTS = Literal[
    "Region Member Directory",
    "Region Appointments Report",
    "Region Permit Report",
    "Region Disclosure Report",
    "Region Training Report",
    "Region Disclosure Management Report",
]  # TODO move to schema.reports if created
_report_types: dict[str, int] = {
    "Region Member Directory": 37,
    "Region Appointments Report": 52,
    "Region Permit Report": 72,
    "Region Disclosure Report": 76,
    "Region Training Report": 84,
    "Region Disclosure Management Report": 100,
}


class Reports:
    def __init__(self, session: ci.Logon):
        """Constructor for Reports."""
        self.auth_ids = session.membership_number, session.role_number, session._jk
        self.client = session._client

        self.current_role = session.current_role
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
            CompassNetworkError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        if report_type not in _report_types:
            types = [*_report_types.keys()]
            raise ci.CompassReportError(f"{report_type} is not a valid report type. Valid report types are {types}") from None

        # Export report
        csv_export = scraper.export_report(self.client, self.auth_ids, _report_types[report_type], stream=False)

        return csv_export
