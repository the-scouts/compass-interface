import datetime
import re
from pathlib import Path
from typing import Tuple

from lxml import html

from compass.logon import CompassLogon
from compass.settings import Settings

# TODO Enum???
report_types = {
    "Region Member Directory": 37,
    "Region Appointments Report": 52,
    "Region Permit Report": 72,
    "Region Disclosure Report": 76,
    "Region Training Report": 84,
    "Region Disclosure Management Report": 100,
}


class CompassReportError(Exception):
    pass


class CompassReportPermissionError(PermissionError, Exception):
    pass


def get_report_token(logon: CompassLogon, report_number: int) -> str:
    params = {
        "pReportNumber": report_number,
        "pMemberRoleNumber": f"{logon.mrn}",
    }
    print("Getting report token")
    response = logon.get(f"{Settings.base_url}{Settings.web_service_path}/ReportToken", auth_header=True, params=params)

    response.raise_for_status()
    report_token_uri = response.json().get("d")

    if report_token_uri in ["-1", "-2", "-3", "-4"]:
        msg = ""
        if report_token_uri in ["-2", "-3"]:
            msg = "Report No Longer Available"
        elif report_token_uri == "-4":
            msg = "USER DOES NOT HAVE PERMISSION"

        raise CompassReportError(f"Report aborted: {msg}")

    return report_token_uri


def get_report_export_url(report_page: str, filename: str = None) -> Tuple[str, dict]:
    full_url = re.search(r'"ExportUrlBase":"(.*?)"', report_page).group(1).encode().decode("unicode-escape")
    export_url_path = full_url.split("?")[0][1:]
    report_export_url_data = dict(param.split("=") for param in full_url.split("?")[1].split("&"))
    report_export_url_data["Format"] = "CSV"
    if filename:
        report_export_url_data["FileName"] = filename

    return export_url_path, report_export_url_data


def get_report(logon: CompassLogon, report_type: str) -> bytes:
    # GET Report Page
    # POST Location Update
    # GET CSV data

    if report_type not in report_types:
        raise CompassReportError(f"{report_type} is not a valid report type. Existing report types are {', '.join(report_types)}")

    run_report_url = get_report_token(logon, report_types[report_type])

    # Compass does user-agent sniffing in reports!!!
    logon.session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

    print("Generating report")
    run_report = f"{Settings.base_url}/{run_report_url}"
    report_page = logon.get(run_report)
    tree = html.fromstring(report_page.content)
    form: html.FormElement = tree.forms[0]

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
    # numbered_districts = {str(i): unicodedata.normalize("NFKD", d) for i, d in enumerate(districts[1:])}
    # all_districts = ", ".join(numbered_districts.values())
    # all_districts_indices = ",".join(numbered_districts.keys())
    #
    # form_data = {
    #     "__VIEWSTATE": elements["__VIEWSTATE"],
    #     "ReportViewer1$ctl04$ctl07$txtValue": all_districts,
    #     "ReportViewer1$ctl04$ctl07$divDropDown$ctl01$HiddenIndices": all_districts_indices,
    # }

    # Including MicrosoftAJAX: Delta=true reduces size by ~1kb but increases time by 0.01s.
    # In reality we don't care about the output of this POST, just that it doesn't fail
    report = logon.post(run_report, data=form_data, headers={"X-MicrosoftAjax": "Delta=true"})
    report.raise_for_status()

    if "compass.scouts.org.uk%2fError.aspx|" in report.text:
        raise CompassReportError("Compass Error!")

    print("Exporting report")
    export_url_path, export_url_params = get_report_export_url(report_page.text)
    csv_export = logon.get(f"{Settings.base_url}/{export_url_path}", params=export_url_params)

    # TODO Debug check
    print("Saving report")
    time_string = datetime.datetime.now().replace(microsecond=0).isoformat().replace(":", "-")  # colons are illegal on windows
    filename = f"{time_string} - {logon.cn} ({logon.current_role}).csv"
    Path(filename).write_bytes(csv_export.content)  # TODO Debug check

    print(len(csv_export.content))
    print("Report Saved")

    return csv_export.content
