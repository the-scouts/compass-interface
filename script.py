import re
from pathlib import Path
import requests
from lxml import html
from src.compass_hierarchy import CompassHierarchy
from src.compass_logon import CompassLogon
from src.compass_people import CompassPeople
from src.compass_people import CompassPeopleScraper
from src.utility import CompassSettings
from src.utility import jk_hash
from typing import Tuple
import unicodedata


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
    Path("export_report all 2.csv").write_bytes(csv_export.content)
    print(len(csv_export.content))
    print('Report Saved')
    print()


def compass_read(auth: list or tuple):
    logon = CompassLogon(auth)
    scraper = CompassPeopleScraper(logon.session)

    member_number = logon.cn
    training_data = scraper.get_training_tab(member_number)
    permits_data = scraper.get_permits_tab(member_number)
    roles_detail = {role: scraper.get_roles_detail(role) for role in training_data["roles"]}

    obj = {
        # **training_data,
        "roles": training_data["roles"],
        "plps": training_data["plps"],
        "mandatory": training_data["mandatory"],
        "permits": permits_data,
        "hierarchies": {role_id: detail["hierarchy"] for role_id, detail in roles_detail.items()},
    }

    return obj


if __name__ == '__main__':
    auth_keys = ['user', 'pass']
    compass_role_to_use = 'Regional Administrator'
    # compass_role_to_use = 'HQ Committee Member - Scout Grants Committee'
    # compass_role_to_use = 'Country Scout Active Support Member'
    # compass_role_to_use = 'County Executive Committee Member'
    # compass_read(auth_keys)
    c_logon = CompassLogon(auth_keys, compass_role_to_use)
    # hierarchy = CompassHierarchy(c_logon.session)
    # people = CompassPeople(c_logon.session)
    # b = people.get_member_data(12047820)
    # a = people._scraper.get_roles_detail(2155910)
    # a = people._scraper.get_roles_detail(760357)
    # a = people.get_member_data(760357)

    get_report(c_logon)

    # SCRATCH #
    leah_sier_id = 11861706
    # a = people._roles_tab(leah_sier_id)
    # b = people.get_member_data(leah_sier_id)
    print()

    # Get all units within a given OU
    # print("Compliance for Cook Meth")
    # cook_meth_compliance = create_compliance_data_for_unit(10013849)
    # cook_meth_compliance.to_csv("cmsg.csv", index=False, encoding="utf-8-sig")
    surrey_county_id = 10000115
    banstead_district_id = 10001222
    cook_meth_id = 10013849
    # surrey_county_id = 10000115
    # cook_meth_id = 10013849
    # surrey_hierarchy = hierarchy.get_hierarchy(cook_meth_id, "Group")
    # table_surrey = hierarchy.hierarchy_to_dataframe(surrey_hierarchy)
    # print(table_surrey)

    # Get all members within that OU  (5020s ~= 1.5 hours for FULL ORG)
    # surrey_members = hierarchy.get_all_members_table(cook_meth_id, table_surrey["compass"])

    # Get all roles within that OU (0.25s per unique member)
    # surrey_roles = people.get_roles_from_members(cook_meth_id, surrey_members["contact_number"])

    print("STOPPED")

    # TODO auto relogon
    # TODO

    # View org entities : https://compass.scouts.org.uk/Popups/Maint/NewOrgEntity.aspx?VIEW=10000001
    # View section ents : https://compass.scouts.org.uk/Popups/Maint/NewSection.aspx?VIEW=11851927

    # View member : https://compass.scouts.org.uk/MemberProfile.aspx?CN=183755
    # View permits: https://compass.scouts.org.uk/MemberProfile.aspx?CN=183755&Page=PERMITS&TAB
    # View awards : https://compass.scouts.org.uk/MemberProfile.aspx?CN=183755&Page=AWARDS&TAB
    # View DBS    : https://compass.scouts.org.uk/MemberProfile.aspx?CN=183755&Page=DISCLOSURES&TAB

    # View permit detail : https://compass.scouts.org.uk/Popups/Maint/NewPermit.aspx?CN=12047820&VIEW=64093&UseCN=849454
