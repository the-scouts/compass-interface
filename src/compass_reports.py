import re
from pathlib import Path
from typing import Tuple

import requests
import unicodedata
from lxml import html

from src.compass_logon import CompassLogon
from src.utility import CompassSettings
from src.utility import jk_hash


def get_report_token(logon: CompassLogon, report_number: int):
    web_service_path = "/JSon.svc"
    headers = {
        'Auth': jk_hash(logon)
    }
    params = {
        "pReportNumber": report_number,
        "pMemberRoleNumber": f"{logon.mrn}",
        # "__": "~",  # This is in the JS source but seems unnecessary
        "x1": f"{logon.cn}",
        "x2": f"{logon.jk}",
        "x3": f"{logon.mrn}",
    }
    print('Getting report token')
    response = logon.get(f"{CompassSettings.base_url}{web_service_path}/ReportToken", headers=headers, params=params)

    response.raise_for_status()  # TODO json result could be -1 to -4 as well, check for those
    report_token_uri = response.json().get('d')

    if report_token_uri == "-4":
        raise PermissionError("Report aborted: USER DOES NOT HAVE PERMISSION")

    return report_token_uri


def get_report_export_url(report_page: str) -> Tuple[str, dict]:
    full_url = re.search(r'"ExportUrlBase":"(.*?)"', report_page).group(1).encode().decode("unicode-escape")
    export_url_path = full_url.split("?")[0][1:]
    report_export_url_data = dict(param.split('=') for param in full_url.split("?")[1].split('&'))
    report_export_url_data["Format"] = "CSV"

    return export_url_path, report_export_url_data


def get_report(logon: CompassLogon):
    reports = {
        'Member Directory': 37,
        'Appointments Report': 52,
        'Permit Report': 72,
        'Disclosure Report': 76,
        'Disclosure Management Report': 100
    }

    # GET Report Page
    # POST Location Update
    # GET CSV data

    run_report_url = get_report_token(logon, reports["Appointments Report"])

    logon.session.headers.update({'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"})

    print('Generating report')
    run_report = f"{CompassSettings.base_url}/{run_report_url}"
    report_page = logon.get(run_report)
    tree = html.fromstring(report_page.content)
    form: html.FormElement = tree.forms[0]

    districts = tree.xpath("//div[@id='ReportViewer1_ctl04_ctl07_divDropDown']//label/text()")
    numbered_districts = {str(i): unicodedata.normalize("NFKD", d) for i, d in enumerate(districts[1:])}
    all_districts = ", ".join(numbered_districts.values())
    all_districts_indices = ",".join(numbered_districts.keys())

    elements = {el.name: el.value for el in form.inputs if el.get("type") not in {'checkbox', 'image'}}

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

    # form_data = {
    #     "__VIEWSTATE": elements["__VIEWSTATE"],
    #     "ReportViewer1$ctl04$ctl05$txtValue": "Regional Roles",
    #     "ReportViewer1$ctl04$ctl05$divDropDown$ctl01$HiddenIndices": "0",
    # }

    form_data = {
        "__VIEWSTATE": elements["__VIEWSTATE"],
        "ReportViewer1$ctl04$ctl07$txtValue": all_districts,
        "ReportViewer1$ctl04$ctl07$divDropDown$ctl01$HiddenIndices": all_districts_indices,
    }

    # Including MSFTAJAX: Delta=true reduces size by ~1kb but increases time by 0.01s.
    # In reality we don't care about the output of this POST, just that it doesn't fail
    report = logon.post(run_report, data=form_data, headers={"X-MicrosoftAjax": "Delta=true"})
    report.raise_for_status()

    if "compass.scouts.org.uk%2fError.aspx|" in report.text:
        raise requests.HTTPError("Compass Error!")

    print('Exporting report')
    export_url_path, export_url_params = get_report_export_url(report_page.text)
    csv_export = logon.get(f"{CompassSettings.base_url}/{export_url_path}", params=export_url_params)
    print('Saving report')
    Path("export_report all 3.csv").write_bytes(csv_export.content)
    print(len(csv_export.content))
    print('Report Saved')
    print()