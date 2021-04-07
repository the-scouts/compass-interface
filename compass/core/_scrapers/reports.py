from __future__ import annotations

import datetime
from pathlib import Path
import re
import time
from typing import Optional, TYPE_CHECKING
import urllib.parse

from lxml import html

from compass.core import errors
from compass.core.interface_base import InterfaceBase
from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core.util import auth_header
from compass.core.util import context_managers

if TYPE_CHECKING:
    import requests


class ReportsScraper(InterfaceBase):
    def __init__(self, session: requests.Session, membership_number: int, role_number: int, jk: str):
        """Constructor for ReportsScraper.

        takes an initialised Session object from Logon
        """
        super().__init__(session)

        self._membership_number = membership_number
        self._role_number = role_number
        self._jk = jk

    def get_report_token(self, report_number: int, role_number: int) -> str:
        params = {
            "pReportNumber": str(report_number),
            "pMemberRoleNumber": str(role_number),
        }
        logger.debug("Getting report token")
        response = auth_header.auth_header_get(
            self._membership_number,
            self._role_number,
            self._jk,
            self.s,
            f"{Settings.web_service_path}/ReportToken",
            params=params,
        )
        response.raise_for_status()

        report_token_uri = str(response.json().get("d"))
        if report_token_uri not in {"-1", "-2", "-3", "-4"}:
            return report_token_uri
        if report_token_uri in {"-2", "-3"}:
            raise errors.CompassReportError("Report aborted: Report No Longer Available")
        if report_token_uri == "-4":  # nosec (false positive B105; not a hardcoded passwordstring)
            raise errors.CompassReportPermissionError("Report aborted: USER DOES NOT HAVE PERMISSION")
        raise errors.CompassReportError("Report aborted")

    @staticmethod
    def get_report_export_url(report_page: str, filename: Optional[str] = None) -> tuple[str, dict[str, str]]:
        full_url_encoded = re.search(r'"ExportUrlBase":"(.*?)"', report_page).group(1)  # type: ignore[union-attr]
        fragments = urllib.parse.urlparse(full_url_encoded.encode().decode("unicode-escape"))
        export_url_path = fragments.path[1:]  # strip leading `/`
        report_export_url_data = dict(urllib.parse.parse_qsl(fragments.query, keep_blank_values=True))
        report_export_url_data["Format"] = "CSV"
        if filename is not None:
            report_export_url_data["FileName"] = filename

        return export_url_path, report_export_url_data

    def get_report_page(self, run_report_url: str) -> bytes:
        # TODO what breaks if we don't update user-agent?
        # Compass does user-agent sniffing in reports!!!
        self.s.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

        # Get initial reports page, for export URL and config.
        logger.info("Generating report")
        report_page = self.s.get(f"{Settings.base_url}/{run_report_url}")

        return report_page.content

    def update_form_data(self, report_page: bytes, run_report: str) -> None:
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
        report = self.s.post(run_report, data=form_data, headers={"X-MicrosoftAjax": "Delta=true"})
        report.raise_for_status()

        # Check error state
        if "compass.scouts.org.uk%2fError.aspx|" in report.text:
            raise errors.CompassReportError("Compass Error!")

    def report_keep_alive(self, report_page: str) -> str:
        logger.info(f"Extending Report Session {datetime.datetime.now()}")
        keep_alive_encoded = re.search(r'"KeepAliveUrl":"(.*?)"', report_page).group(1)  # type: ignore[union-attr]
        keep_alive = keep_alive_encoded.encode().decode("unicode-escape")
        response = self.s.post(f"{Settings.base_url}{keep_alive}")  # NoQA: F841 (unused variable)

        return keep_alive  # response

    def download_report_streaming(self, url: str, params: dict[str, str], filename: str) -> None:
        with self.s.get(url, params=params, stream=True) as r:
            r.raise_for_status()
            with context_managers.filesystem_guard("Unable to write report export"), open(filename, "wb") as f:
                for chunk in r.iter_content(chunk_size=1024 ** 2):  # Chunk size == 1MiB
                    f.write(chunk)

    def download_report_normal(self, url: str, params: dict[str, str], filename: str) -> bytes:
        start = time.time()
        csv_export = self.s.get(url, params=params)
        logger.debug(f"Exporting took {time.time() - start}s")
        logger.info("Saving report")
        with context_managers.filesystem_guard("Unable to write report export"):
            Path(filename).write_bytes(csv_export.content)
        logger.info("Report Saved")

        logger.debug(len(csv_export.content))

        return csv_export.content
