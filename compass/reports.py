# pylint: disable=protected-access
from __future__ import annotations

import datetime
import enum
from pathlib import Path
import re
import time
from typing import TYPE_CHECKING
import urllib.parse

from lxml import html

from compass.errors import CompassReportError
from compass.errors import CompassReportPermissionError
from compass.interface_base import InterfaceBase
from compass.logging import logger
from compass.logon import Logon
from compass.settings import Settings

if TYPE_CHECKING:
    import requests


class ReportTypes(enum.IntEnum):
    region_member_directory = 37
    region_appointments_report = 52
    region_permit_report = 72
    region_disclosure_report = 76
    region_training_report = 84
    region_disclosure_management_report = 100


class ReportsScraper(InterfaceBase):
    def __init__(self, session: requests.Session):
        """Constructor for ReportsScraper.

        takes an initialised Session object from Logon
        """
        super().__init__(session)

    def get_report_token(self, report_number: int, role_number: int) -> str:
        params = {
            "pReportNumber": report_number,
            "pMemberRoleNumber": role_number,
        }
        logger.debug("Getting report token")
        response = self._get(f"{Settings.web_service_path}/ReportToken", auth_header=True, params=params)
        response.raise_for_status()

        report_token_uri = response.json().get("d")
        if report_token_uri not in {"-1", "-2", "-3", "-4"}:
            return report_token_uri
        elif report_token_uri in {"-2", "-3"}:
            raise CompassReportError("Report aborted: Report No Longer Available")
        elif report_token_uri == "-4":
            raise CompassReportError("Report aborted: USER DOES NOT HAVE PERMISSION")

        raise CompassReportError(f"Report aborted")

    @staticmethod
    def get_report_export_url(report_page: str, filename: str = None) -> tuple[str, dict]:
        full_url = re.search(r'"ExportUrlBase":"(.*?)"', report_page).group(1).encode().decode("unicode-escape")
        fragments = urllib.parse.urlparse(full_url)
        export_url_path = fragments.path[1:]  # strip leading `/`
        report_export_url_data = dict(urllib.parse.parse_qsl(fragments.query, keep_blank_values=True))
        report_export_url_data["Format"] = "CSV"
        if filename:
            report_export_url_data["FileName"] = filename

        return export_url_path, report_export_url_data

    def get_report_page(self, run_report_url: str) -> bytes:
        # TODO what breaks if we don't update user-agent?
        # Compass does user-agent sniffing in reports!!!
        self._update_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

        # Get initial reports page, for export URL and config.
        logger.info("Generating report")
        report_page = self._get(f"{Settings.base_url}/{run_report_url}")

        return report_page.content

    def update_form_data(self, report_page: bytes, run_report: str):
        form = html.fromstring(report_page).forms[0]
        elements = {el.name: el.value for el in form.inputs if el.get("type") not in {"checkbox", "image"}}

        # Table Controls: table#ParametersGridReportViewer1_ctl04
        # ReportViewer1$ctl04$ctl03$ddValue - Region/County(District) Label
        # ReportViewer1$ctl04$ctl05$txtValue - County Label
        # ReportViewer1$ctl04$ctl07$txtValue - District Label
        # ReportViewer1$ctl04$ctl09$txtValue - Role Types (Status)
        # ReportViewer1$ctl04$ctl15$txtValue - Columns Label

        # ReportViewer1_ctl04_ctl07_divDropDown - Districts
        # ReportViewer1_ctl04_ctl05_divDropDown - Counties
        # ReportViewer1_ctl04_ctl09_divDropDown - Role Types
        # ReportViewer1_ctl04_ctl15_divDropDown - Columns

        form_data = {
            "__VIEWSTATE": elements["__VIEWSTATE"],
            "ReportViewer1$ctl04$ctl05$txtValue": "Regional Roles",
            "ReportViewer1$ctl04$ctl05$divDropDown$ctl01$HiddenIndices": "0",
        }

        # districts = tree.xpath("//div[@id='ReportViewer1_ctl04_ctl07_divDropDown']//label/text()")
        # list_districts = [unicodedata.normalize("NFKD", d) for d in districts if "select all" not in d.lower()]
        # numbered_districts = {str(i): d for i, d in enumerate(list_districts)}
        # all_districts = ", ".join(numbered_districts.values())
        # all_districts_indices = ",".join(numbered_districts.keys())
        #
        # counties = tree.xpath("//div[@id='ReportViewer1_ctl04_ctl05_divDropDown']//label/text()")
        # list_counties = [unicodedata.normalize("NFKD", c) for c in counties if "select all" not in c.lower()]
        # numbered_counties = {str(i): c for i, c in enumerate(list_counties)}
        # all_counties = ", ".join(numbered_counties.values())
        # all_counties_indices = ",".join(numbered_counties.keys())
        #
        # form_data = {
        #     "__VIEWSTATE": elements["__VIEWSTATE"],
        #     "ReportViewer1$ctl04$ctl05$txtValue": all_counties,
        #     "ReportViewer1$ctl04$ctl05$divDropDown$ctl01$HiddenIndices": all_counties_indices,
        #     "ReportViewer1$ctl04$ctl07$txtValue": all_districts,
        #     "ReportViewer1$ctl04$ctl07$divDropDown$ctl01$HiddenIndices": all_districts_indices,
        # }

        # Including MicrosoftAJAX: Delta=true reduces size by ~1kb but increases time by 0.01s.
        # In reality we don't care about the output of this POST, just that it doesn't fail
        report = self._post(run_report, data=form_data, headers={"X-MicrosoftAjax": "Delta=true"})
        report.raise_for_status()

        # Check error state
        if "compass.scouts.org.uk%2fError.aspx|" in report.text:
            raise CompassReportError("Compass Error!")

    def download_report_streaming(self, url: str, params: dict, filename: str, ska_url=None):
        with self._get(url, params=params, stream=True) as r:
            print("")
            r.raise_for_status()
            with open(filename, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024 ** 2):  # Chunk size == 1MiB
                    f.write(chunk)

    def download_report_normal(self, url: str, params: dict, filename: str) -> requests.Response:
        start = time.time()
        csv_export = self._get(url, params=params)
        print(f"Exporting took {time.time() - start}s")
        print("Saving report")
        Path(filename).write_bytes(csv_export.content)  # TODO Debug check
        print("Report Saved")

        print(len(csv_export.content))

        return csv_export


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
