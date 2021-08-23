from __future__ import annotations

import re
import time
from typing import cast, Literal, TYPE_CHECKING

from lxml import html
import requests

import compass.core as ci
from compass.core.logger import logger
from compass.core.settings import Settings
from compass.core.util import auth_header

if TYPE_CHECKING:
    from compass.core.util.auth_header import TYPE_AUTH_IDS
    from compass.core.util.client import Client

# TODO move to schema.reports if created
# TODO remove location from start, to keep list small
_report_ids_appointments: dict[ci.TYPES_UNIT_LEVELS, int] = {
    "Group": 59,
    "District": 50,
    "County": 48,
    "Region": 52,
}
_report_ids_member_directory: dict[ci.TYPES_UNIT_LEVELS, int] = {
    "District": 51,
    "County": 49,
    "Region": 37,
}
_report_ids_18_25_member_directory: dict[ci.TYPES_UNIT_LEVELS, int] = {
    "County": 53,
}
_report_ids_permits: dict[ci.TYPES_UNIT_LEVELS, int] = {
    "District": 70,
    "County": 69,
    "Region": 72,
}
_report_ids_disclosure: dict[ci.TYPES_UNIT_LEVELS, int] = {
    "District": 78,
    "County": 77,
    "Region": 76,
}
_report_ids_training: dict[ci.TYPES_UNIT_LEVELS, int] = {
    "District": 79,
    "County": 80,
    "Region": 84,
}
_report_ids_awards: dict[ci.TYPES_UNIT_LEVELS, int] = {
    "District": 94,
    "County": 95,
}
_report_ids_disclosure_management: dict[ci.TYPES_UNIT_LEVELS, int] = {
    "District": 102,
    "County": 101,
    "Region": 100,
}
TYPES_REPORTS = Literal[
    "Appointments Report",
    "Member Directory Report",
    "18-25 Member Directory Report",
    "Permits Report",
    "Disclosure Report",
    "Training Report",
    "Awards Report",
    "Disclosure Management Report",
]
_report_ids: dict[TYPES_REPORTS, dict[ci.TYPES_UNIT_LEVELS, int]] = {
    "Appointments Report": _report_ids_appointments,
    "Member Directory Report": _report_ids_member_directory,
    "18-25 Member Directory Report": _report_ids_18_25_member_directory,
    "Permits Report": _report_ids_permits,
    "Disclosure Report": _report_ids_disclosure,
    "Training Report": _report_ids_training,
    "Awards Report": _report_ids_awards,
    "Disclosure Management Report": _report_ids_disclosure_management,
}


def export_report(
    client: Client,
    report_type: TYPES_REPORTS,
    hierarchy_level: ci.TYPES_HIERARCHY_LEVELS,
    auth_ids: TYPE_AUTH_IDS,
    stream: bool = False,
) -> str:
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
    if report_type not in _report_ids:
        types = [*_report_ids]
        raise ci.CompassReportError(f"{report_type} is not a valid report type. Valid report types are {types}") from None
    report_level_map = _report_ids[report_type]
    if hierarchy_level not in report_level_map:
        raise ci.CompassReportError(f"Requested report does not exist for hierarchy level: {hierarchy_level}.")
    hierarchy_level = cast(ci.TYPES_UNIT_LEVELS, hierarchy_level)
    report_number = report_level_map[hierarchy_level]

    # Get token for report type & role running said report:
    run_report_url = _get_report_token(client, auth_ids, report_number)

    # Get initial reports page, for export URL and config:
    logger.info("Generating report")
    report_page = client.get(run_report_url).content

    # Update form data & set location selection:
    _update_form_data(client, report_page, run_report_url, report_number)

    # Get report export URL:
    logger.info("Exporting report")
    export_url = _extract_report_export_url(report_page.decode("UTF-8"))

    # Download report to CSV:
    start = time.time()
    csv_export = _download_report(client, export_url, streaming=stream)
    logger.debug(f"Downloading took {time.time() - start:.2f}s")

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
    logger.debug("Getting report token")
    response = auth_header.auth_header_get(
        auth_ids,
        client,
        f"{Settings.web_service_path}/ReportToken",
        params={
            "pReportNumber": str(report_number),
            "pMemberRoleNumber": str(auth_ids[1]),  # auth IDs are membership number, role number, 'jk'
        },
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
    if report_number in {48, 52}:  # County, Region
        form_data = _form_data_appointments(form_data, tree)

    # Compass does user-agent sniffing in reports!!! This does seem to be the
    # only place that *requires* a Mozilla/5 type UA.
    # Including the MicrosoftAjax pair lets us check errors quickly. In reality
    # we don't care about the output of this POST, just that it doesn't fail.
    updated_report_page = client.post(
        run_report,
        data=form_data,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "X-MicrosoftAjax": "Delta=true"},
    )

    # Check error state
    _error_status(updated_report_page, msg="Updating report locations failed!")
    if "compass.scouts.org.uk%2fError.aspx|" in updated_report_page.text:
        raise ci.CompassReportError("Compass Error!")


def _form_data_appointments(form_data: dict[str, str], tree: html.HtmlElement) -> dict[str, str | None]:
    """Select all units/locations."""
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

    # report level - 1 (e.g. county -> district)
    numbered_levels_children = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl05_divDropDown")
    form_data["ReportViewer1$ctl04$ctl05$txtValue"] = ", ".join(numbered_levels_children.values())
    form_data["ReportViewer1$ctl04$ctl05$divDropDown$ctl01$HiddenIndices"] = ",".join(numbered_levels_children.keys())

    # report level - 2 (e.g. county -> group)
    numbered_levels_grandchildren = _parse_drop_down_list(tree, "ReportViewer1_ctl04_ctl07_divDropDown")
    form_data["ReportViewer1$ctl04$ctl07$txtValue"] = ", ".join(numbered_levels_grandchildren.values())
    form_data["ReportViewer1$ctl04$ctl07$divDropDown$ctl01$HiddenIndices"] = ",".join(numbered_levels_grandchildren.keys())

    return form_data | additional_form_data


def _extract_report_export_url(report_page: str) -> str:
    start = report_page.index("ExportUrlBase")
    cut = report_page[start:].removeprefix('ExportUrlBase":"')
    end = cut.index('"')
    full_url = cut[:end].encode().decode("unicode-escape")
    return f"{Settings.base_url}/{full_url}CSV"


def _download_report(client: Client, url: str, streaming: bool) -> str:
    # standard download
    if not streaming:
        return client.get(url).content.decode("utf-8-sig")  # report is returned with Byte Order Mark

    # streaming download
    csv_export = b""
    with client.get(url, stream=True) as r:
        _error_status(r)
        for chunk in r.iter_content(chunk_size=None):  # Chunk size == 1MiB
            csv_export += chunk
    return csv_export.decode("utf-8-sig")  # report is returned with Byte Order Mark


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
