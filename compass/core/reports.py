from __future__ import annotations

import compass.core as ci
from compass.core._scrapers.reports import export_report

__all__ = ("Reports",)
CSV: ci.TYPES_FORMAT_CODES = frozenset({"CSV"})


class Reports:
    """Interfaces with Compass's reporting engine.

    Exporting a report is of course surprisingly complicated. The process
    has four major steps, as follows:

    1. Get a token for generating the report from the Compass backend. This
        also validates that the report exists and that the user is
        authenticated to access it.
    2. Get the export URL from the report page, using the report token
        as a relative URL.
    3. Update report configuration data (sent as form data), and check that we
        are not in an error state. (Compass does not include all organisational
        units in reports by default, and we need to add in these missing/unset
        levels manually to export all data for a given unit and downwards).
    4. We export the prepared report in the specified format.

    Pitfalls to be aware of in this process include that:
    - Compass checks user-agent headers when updating form data
    - There is a ten (10) minute default soft-timeout, which may run out
        before a report download has finished
    - If a requested report is too large, Compass can simply give up, often
        with an `OutOfMemory` error or similar

    """

    def __init__(self, session: ci.Logon):
        """Constructor for Reports."""
        self.auth_ids = session.membership_number, session.role_number, session._jk
        self.client = session._client
        self.hierarchy_level = session.hierarchy.level

    def _get_report(self, report_type: ci.TYPES_REPORTS, formats: ci.TYPES_FORMAT_CODES = CSV) -> ci.TYPES_EXPORTED_REPORTS:
        """Exports report from Compass.

        Returns:
            Exported report content

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
        return export_report(self.client, report_type, self.hierarchy_level, self.auth_ids, formats)

    def appointments(self, formats: ci.TYPES_FORMAT_CODES = CSV) -> ci.TYPES_EXPORTED_REPORTS:
        """Exports appointments reports from Compass.

        Returns:
            Exported report content

        Raises:
            CompassReportError:
                - If Compass returns a JSON error
                - If there is an error updating the form data
            CompassReportPermissionError:
                If the user does not have permission to run the report
            CompassNetworkError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        return self._get_report("Appointments Report", formats)

    def member_directory(self, formats: ci.TYPES_FORMAT_CODES = CSV) -> ci.TYPES_EXPORTED_REPORTS:
        """Exports member directory reports from Compass.

        Returns:
            Exported report content

        Raises:
            CompassReportError:
                - If Compass returns a JSON error
                - If there is an error updating the form data
            CompassReportPermissionError:
                If the user does not have permission to run the report
            CompassNetworkError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        return self._get_report("Member Directory Report", formats)

    def member_directory_18_25(self, formats: ci.TYPES_FORMAT_CODES = CSV) -> ci.TYPES_EXPORTED_REPORTS:
        """Exports member directory (18-25) reports from Compass.

        Returns:
            Exported report content

        Raises:
            CompassReportError:
                - If Compass returns a JSON error
                - If there is an error updating the form data
            CompassReportPermissionError:
                If the user does not have permission to run the report
            CompassNetworkError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        return self._get_report("18-25 Member Directory Report", formats)

    def permits(self, formats: ci.TYPES_FORMAT_CODES = CSV) -> ci.TYPES_EXPORTED_REPORTS:
        """Exports permits reports from Compass.

        Returns:
            Exported report content

        Raises:
            CompassReportError:
                - If Compass returns a JSON error
                - If there is an error updating the form data
            CompassReportPermissionError:
                If the user does not have permission to run the report
            CompassNetworkError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        return self._get_report("Permits Report", formats)

    def disclosure(self, formats: ci.TYPES_FORMAT_CODES = CSV) -> ci.TYPES_EXPORTED_REPORTS:
        """Exports disclosure reports from Compass.

        Returns:
            Exported report content

        Raises:
            CompassReportError:
                - If Compass returns a JSON error
                - If there is an error updating the form data
            CompassReportPermissionError:
                If the user does not have permission to run the report
            CompassNetworkError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        return self._get_report("Disclosure Report", formats)

    def training(self, formats: ci.TYPES_FORMAT_CODES = CSV) -> ci.TYPES_EXPORTED_REPORTS:
        """Exports training reports from Compass.

        Returns:
            Exported report content

        Raises:
            CompassReportError:
                - If Compass returns a JSON error
                - If there is an error updating the form data
            CompassReportPermissionError:
                If the user does not have permission to run the report
            CompassNetworkError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        return self._get_report("Training Report", formats)

    def awards(self, formats: ci.TYPES_FORMAT_CODES = CSV) -> ci.TYPES_EXPORTED_REPORTS:
        """Exports awards reports from Compass.

        Returns:
            Exported report content

        Raises:
            CompassReportError:
                - If Compass returns a JSON error
                - If there is an error updating the form data
            CompassReportPermissionError:
                If the user does not have permission to run the report
            CompassNetworkError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        return self._get_report("Awards Report", formats)

    def disclosure_management(self, formats: ci.TYPES_FORMAT_CODES = CSV) -> ci.TYPES_EXPORTED_REPORTS:
        """Exports disclosure management reports from Compass.

        Returns:
            Exported report content

        Raises:
            CompassReportError:
                - If Compass returns a JSON error
                - If there is an error updating the form data
            CompassReportPermissionError:
                If the user does not have permission to run the report
            CompassNetworkError:
                If there is an error in the transport layer, or if Compass
                reports a HTTP 5XX status code

        """
        return self._get_report("Disclosure Management Report", formats)
