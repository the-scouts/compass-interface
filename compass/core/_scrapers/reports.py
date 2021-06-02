from __future__ import annotations

import datetime
from pathlib import Path
import re
import time
from typing import TYPE_CHECKING

import requests
from lxml import html

import compass.core as ci
from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core.util import auth_header
from compass.core.util import context_managers

if TYPE_CHECKING:
    from compass.core.util.client import Client


def _error_status(response: requests.Response, /, msg: str = "Request to Compass failed!") -> None:
    try:
        response.raise_for_status()
    except requests.HTTPError as err:
        raise ci.CompassNetworkError(msg) from err


def get_report_token(client: Client, auth_ids: tuple[int, int, str], report_number: int) -> str:
    membership_number, role_number, jk = auth_ids
    params = {
        "pReportNumber": str(report_number),
        "pMemberRoleNumber": str(role_number),
    }
    logger.debug("Getting report token")
    response = auth_header.auth_header_get(
        membership_number,
        role_number,
        jk,
        client,
        f"{Settings.web_service_path}/ReportToken",
        params=params,
    )
    _error_status(response)

    report_token_uri = response.json().get("d", "")
    if report_token_uri not in {"-1", "-2", "-3", "-4"}:
        return f"{Settings.base_url}/{report_token_uri}"
    if report_token_uri in {"-2", "-3"}:
        raise ci.CompassReportError("Report aborted: Report No Longer Available")
    if report_token_uri == "-4":  # nosec (false positive B105; not a hardcoded passwordstring)
        raise ci.CompassReportPermissionError("Report aborted: USER DOES NOT HAVE PERMISSION")
    raise ci.CompassReportError("Report aborted")


def get_report_export_url(report_page: str) -> str:
    cut = report_page[report_page.index("ExportUrlBase"):].removeprefix('ExportUrlBase":"')
    full_url = cut[:cut.index('"')].encode().decode("unicode-escape")
    return f"{full_url}CSV"


def update_form_data(client: Client, report_page: bytes, run_report: str, full_extract: bool = True) -> None:
    tree = html.fromstring(report_page)
    # form_data = {"__VIEWSTATE": next((el.value for el in tree.forms[0].iter("input") if el.name == "__VIEWSTATE"), "")}
    form_data = {el.name: el.value for el in tree.forms[0].inputs if el.get("type") not in {"checkbox", "image"}}
    form_data |= {
        "ReportViewer1$ctl10": "ltr",
        "ReportViewer1$ctl11": "standards",
        "ReportViewer1$ctl05$ctl00$CurrentPage": "1",
        "ReportViewer1$ctl09$VisibilityState$ctl00": "ReportPage",
        "__EVENTTARGET": "ReportViewer1$ctl04$ctl07",
        "__EVENTARGUMENT": None,
        "__LASTFOCUS": None,
        "__ASYNCPOST": "true"
    }  # TODO this may not be needed. Test.

    # Table Controls: table#ParametersGridReportViewer1_ctl04
    # ReportViewer1$ctl04$ctl03$ddValue - Region/County(District) Label
    # ReportViewer1$ctl04$ctl05$txtValue - County Label
    # ReportViewer1$ctl04$ctl07$txtValue - District Label
    # ReportViewer1$ctl04$ctl09$txtValue - Role Statuses
    # ReportViewer1$ctl04$ctl15$txtValue - Columns Label

    # ReportViewer1_ctl04_ctl07_divDropDown - Districts
    # ReportViewer1_ctl04_ctl05_divDropDown - Counties
    # ReportViewer1_ctl04_ctl09_divDropDown - Role Statuses
    # ReportViewer1_ctl04_ctl15_divDropDown - Columns

    numbered_counties = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl05_divDropDown")
    numbered_districts = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl07_divDropDown")
    numbered_role_statuses = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl09_divDropDown")
    numbered_column_names = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl15_divDropDown")
    # numbered_districts = ",".join(str(i) for i in range(len(tree.get_element_by_id("ReportViewer1_ctl04_ctl07_divDropDown")[0][0])-1))

    # # Export regional roles only
    # form_data["ReportViewer1$ctl04$ctl05$txtValue"] = "Regional Roles"
    # form_data["ReportViewer1$ctl04$ctl05$divDropDown$ctl01$HiddenIndices"] = "0"

    # Export all districts
    form_data["ReportViewer1$ctl04$ctl05$txtValue"] = ", ".join(numbered_counties.values())
    form_data["ReportViewer1$ctl04$ctl05$divDropDown$ctl01$HiddenIndices"] = ",".join(numbered_counties.keys())
    form_data["ReportViewer1$ctl04$ctl07$txtValue"] = ", ".join(numbered_districts.values())
    form_data["ReportViewer1$ctl04$ctl07$divDropDown$ctl01$HiddenIndices"] = ",".join(numbered_districts.keys())

    # TODO this may not be needed. Test.
    # update text values of role statuses and column names from default indices
    form_data["ReportViewer1$ctl04$ctl09$txtValue"] = ", ".join(numbered_role_statuses[i] for i in form_data.get("ReportViewer1$ctl04$ctl09$divDropDown$ctl01$HiddenIndices", "").split(","))
    form_data["ReportViewer1$ctl04$ctl15$txtValue"] = ", ".join(numbered_column_names[i] for i in form_data.get("ReportViewer1$ctl04$ctl15$divDropDown$ctl01$HiddenIndices", "").split(","))

    # Including MicrosoftAJAX: Delta=true lets us check errors quickly
    # In reality we don't care about the output of this POST, just that it doesn't fail
    # Compass does user-agent sniffing in reports!!!
    report = client.post(run_report, data=form_data, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "X-MicrosoftAjax": "Delta=true"})

    # Check error state
    _error_status(report, msg="Updating report locations failed!")
    if "compass.scouts.org.uk%2fError.aspx|" in report.text:
        raise ci.CompassReportError("Compass Error!")


def _parse_drop_down_list(tree: html.HtmlElement, element_id: str, /) -> dict[str, str]:
    table = tree.get_element_by_id(element_id)[0][0]
    return {str(i): row[0][0][0][1].text.replace("\xa0", " ") for i, row in enumerate(table[1:])}


def report_keep_alive(client: Client, report_page: str) -> str:
    logger.info(f"Extending Report Session {datetime.datetime.now()}")
    keep_alive_encoded = re.search(r'"KeepAliveUrl":"(.*?)"', report_page).group(1)  # type: ignore[union-attr]
    keep_alive = keep_alive_encoded.encode().decode("unicode-escape")
    response = client.post(f"{Settings.base_url}{keep_alive}")  # NoQA: F841 (unused variable)

    return keep_alive  # response


def download_report_streaming(client: Client, url: str, params: dict[str, str], filename: str) -> None:
    with client.get(url, params=params, stream=True) as r:
        _error_status(r)
        with context_managers.filesystem_guard("Unable to write report export"), open(filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 ** 2):  # Chunk size == 1MiB
                f.write(chunk)


def download_report_normal(client: Client, url: str, filename: str) -> bytes:
    start = time.time()
    csv_export = client.get(f"{Settings.base_url}/{url}")
    logger.debug(f"Exporting took {time.time() - start:.2f}s")
    logger.info("Saving report")
    with context_managers.filesystem_guard("Unable to write report export"):
        Path(filename).write_bytes(csv_export.content)
    logger.info("Report Saved")

    logger.debug(len(csv_export.content))

    return csv_export.content
