from __future__ import annotations

from pathlib import Path
import re
import time
from typing import Literal, TYPE_CHECKING

from lxml import html
import requests

import compass.core as ci
from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core.util import auth_header
from compass.core.util import context_managers

if TYPE_CHECKING:
    from compass.core.util.auth_header import TYPE_AUTH_IDS
    from compass.core.util.client import Client

# TODO move to schema.reports if created
# TODO remove location from start, to keep list small
_report_types: dict[str, int] = {
    # group reports
    "Group Appointments Report": 59,
    # district reports
    "District Appointments Report": 50,
    "District Member Directory Report": 51,
    # "District Member Directory 18 To 25 Years": ,
    "District Permits Report": 70,
    "District Disclosure Report": 78,
    "District Training Report": 79,
    "District Awards Report": 94,
    "District Disclosure Management Report": 102,
    # county reports
    "County/Area/Region Appointments Report": 48,
    "County/Area/Region Member Directory Report": 49,
    "County/Area/Region Member Directory 18 To 25 Years": 53,
    "County/Area/Region Permits Report": 69,
    "County/Area/Region Disclosure Report": 77,
    "County/Area/Region Training Report": 80,
    "County/Area/Region Awards Report": 95,
    "County Disclosure Management Report": 101,
    # region reports
    "Region Member Directory": 37,
    "Region Appointments Report": 52,
    "Region Permit Report": 72,
    "Region Disclosure Report": 76,
    "Region Training Report": 84,
    "Region Disclosure Management Report": 100,
}
TYPES_REPORTS = Literal[
    # group
    "Group Appointments Report",
    # district
    "District Appointments Report",
    "District Member Directory Report",
    "District Permits Report",
    "District Disclosure Report",
    "District Training Report",
    "District Awards Report",
    "District Disclosure Management Report",
    # county
    "County/Area/Region Appointments Report",
    "County/Area/Region Member Directory Report",
    "County/Area/Region Member Directory 18 To 25 Years",
    "County/Area/Region Permits Report",
    "County/Area/Region Disclosure Report",
    "County/Area/Region Training Report",
    "County/Area/Region Awards Report",
    "County Disclosure Management Report",
    # region
    "Region Member Directory",
    "Region Appointments Report",
    "Region Permit Report",
    "Region Disclosure Report",
    "Region Training Report",
    "Region Disclosure Management Report",
]


def export_report(client: Client, auth_ids: TYPE_AUTH_IDS, report_type: TYPES_REPORTS, stream: bool = False) -> bytes:
    """Exports report as CSV from Compass.

    See `Reports.get_report` for an overview of the export process

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
    report_number = _report_types[report_type]

    # Get token for report type & role running said report:
    run_report_url = _get_report_token(client, auth_ids, report_number)

    # Get initial reports page, for export URL and config:
    logger.info("Generating report")
    report_page = client.get(run_report_url).content

    # Update form data & set location selection:
    _update_form_data(client, report_page, run_report_url, report_number)

    # Export the report:
    logger.info("Exporting report")
    export_url = _extract_report_export_url(report_page.decode("UTF-8"))

    time_string = time.strftime("%Y-%m-%d %H-%M-%S")  # colons are illegal on windows
    filename = f"Compass Export - {report_type} - {time_string}.csv"
    csv_export = _download_report(client, export_url, streaming=stream, filename=filename)

    # start = time.time()
    # TODO TRAINING REPORT ETC.
    # # TODO REPORT BODY HAS KEEP ALIVE URL KeepAliveUrl
    # p = PeriodicTimer(15, lambda: self.report_keep_alive(self.session, report_page.text))
    # self.session.sto_thread.start()
    # p.start()
    # # ska_url = _report_keep_alive(self.session, report_page.text)
    # try:
    #     _download_report(self.session, f"{Settings.base_url}/{export_url_path}", export_url_params, filename, )  # ska_url
    # except (ConnectionResetError, requests.ConnectionError):
    #     logger.info(f"Stopped at {datetime.datetime.now()}")
    #     p.cancel()
    #     self.session.sto_thread.cancel()
    #     raise
    # logger.debug(f"Exporting took {time.time() - start}s")

    return csv_export


def _get_report_token(client: Client, auth_ids: TYPE_AUTH_IDS, report_number: int) -> str:
    params = {
        "pReportNumber": str(report_number),
        "pMemberRoleNumber": str(auth_ids[1]),  # auth IDs are membership number, role number, 'jk'
    }
    logger.debug("Getting report token")
    response = auth_header.auth_header_get(
        auth_ids,
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


def _update_form_data(client: Client, report_page: bytes, run_report: str, report_number: int) -> None:
    # TODO add method to choose between exporting all data and just top-level
    tree = html.fromstring(report_page)

    # get relevant form data. TODO - do we need all items or just __VIEWSTATE?
    # form_data = {"__VIEWSTATE": next((el.value for el in tree.forms[0].iter("input") if el.name == "__VIEWSTATE"), "")}
    form_data = {el.name: el.value for el in tree.forms[0].inputs if el.get("type") not in {"checkbox", "image"}}

    # Appointments Reports
    if report_number == 52:
        form_data = _form_data_appointments(form_data, tree)

    # Compass does user-agent sniffing in reports!!! This does seem to be the
    # only place that *requires* a Mozilla/5 type UA.
    # Including the MicrosoftAjax pair lets us check errors quickly. In reality
    # we don't care about the output of this POST, just that it doesn't fail.
    report = client.post(
        run_report,
        data=form_data,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "X-MicrosoftAjax": "Delta=true"},
    )

    # Check error state
    _error_status(report, msg="Updating report locations failed!")
    if "compass.scouts.org.uk%2fError.aspx|" in report.text:
        raise ci.CompassReportError("Compass Error!")


def _form_data_appointments(form_data: dict[str, str], tree: html.HtmlElement) -> dict[str, str | None]:
    additional_form_data = {
        "ReportViewer1$ctl10": "ltr",
        "ReportViewer1$ctl11": "standards",
        "ReportViewer1$ctl05$ctl00$CurrentPage": "1",
        "ReportViewer1$ctl09$VisibilityState$ctl00": "ReportPage",
        "__EVENTTARGET": "ReportViewer1$ctl04$ctl07",
        "__EVENTARGUMENT": None,
        "__LASTFOCUS": None,
        "__ASYNCPOST": "true",
    }  # TODO this may not be needed. Test.

    # ReportViewer1$ctl04$ctl05$txtValue - County Label
    # ReportViewer1$ctl04$ctl07$txtValue - District Label
    # ReportViewer1$ctl04$ctl09$txtValue - Role Statuses
    # ReportViewer1$ctl04$ctl15$txtValue - Columns Label

    numbered_counties = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl05_divDropDown")  # Counties
    numbered_districts = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl07_divDropDown")  # Districts
    numbered_role_statuses = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl09_divDropDown")  # Role Statuses
    numbered_column_names = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl15_divDropDown")  # Report Fields

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
    form_data["ReportViewer1$ctl04$ctl09$txtValue"] = _get_defaults_labels(
        form_data, "ReportViewer1$ctl04$ctl09$divDropDown$ctl01$HiddenIndices", numbered_role_statuses
    )
    form_data["ReportViewer1$ctl04$ctl15$txtValue"] = _get_defaults_labels(
        form_data, "ReportViewer1$ctl04$ctl15$divDropDown$ctl01$HiddenIndices", numbered_column_names
    )

    return form_data | additional_form_data


def _extract_report_export_url(report_page: str) -> str:
    start = report_page.index("ExportUrlBase")
    cut = report_page[start:].removeprefix('ExportUrlBase":"')
    end = cut.index('"')
    full_url = cut[:end].encode().decode("unicode-escape")
    return f"{full_url}CSV"


def _download_report(client: Client, url_path: str, streaming: bool, filename: str | None = None) -> bytes:
    start = time.time()
    url = f"{Settings.base_url}/{url_path}"

    # actually do the download
    if streaming:
        csv_export = b""
        with client.get(url, stream=True) as r:
            _error_status(r)
            for chunk in r.iter_content(chunk_size=None):  # Chunk size == 1MiB
                csv_export += chunk
    else:
        csv_export = client.get(url).content

    logger.debug(f"Exporting took {time.time() - start:.2f}s")

    # maybe save to disk
    if filename is not None:
        logger.info("Saving report")
        with context_managers.filesystem_guard("Unable to write report export"):
            Path(filename).write_bytes(csv_export)
        logger.info("Report Saved")

    return csv_export


def _error_status(response: requests.Response, /, msg: str = "Request to Compass failed!") -> None:
    try:
        response.raise_for_status()
    except requests.HTTPError as err:
        raise ci.CompassNetworkError(msg) from err


def _parse_drop_down_list(tree: html.HtmlElement, element_id: str, /) -> dict[str, str]:
    table = tree.get_element_by_id(element_id)[0][0]
    return {str(i): row[0][0][0][1].text.replace("\xa0", " ") for i, row in enumerate(table[1:])}


def _get_defaults_labels(form_data: dict[str, str], default_indices_key: str, labels_map: dict[str, str]) -> str:
    indices = form_data.get(default_indices_key, "").split(",")
    return ", ".join(labels_map[i] for i in indices)


def _report_keep_alive(client: Client, report_page: str) -> str:
    logger.info(f"Extending Report Session {time.strftime('%Y-%m-%d %H-%M-%S')}")
    keep_alive_encoded = re.search(r'"KeepAliveUrl":"(.*?)"', report_page).group(1)  # type: ignore[union-attr]
    keep_alive = keep_alive_encoded.encode().decode("unicode-escape")
    response = client.post(f"{Settings.base_url}{keep_alive}")  # NoQA: F841 (unused variable)

    return keep_alive  # response
