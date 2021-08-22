import compass.core as ci
from compass.core._scrapers.reports import export_report
from compass.core._scrapers.reports import TYPES_REPORTS

__all__ = ("Reports", "TYPES_REPORTS")  # only needed whilst still no schema file for reports


class Reports:
    def __init__(self, session: ci.Logon):
        """Constructor for Reports."""
        self.auth_ids = session.membership_number, session.role_number, session._jk
        self.client = session._client
        self.hierarchy_level = session.hierarchy.level

    def get_report(self, report_type: TYPES_REPORTS) -> str:
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
        return export_report(self.client, report_type, self.hierarchy_level, self.auth_ids, stream=False)
