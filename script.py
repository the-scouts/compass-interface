import re

from src.compass_hierarchy import CompassHierarchy
from src.compass_logon import CompassLogon
from src.compass_people import CompassPeople
from src.compass_people import CompassPeopleScraper
from src.utility import CompassSettings
from src.utility import jk_hash


def get_report(logon: CompassLogon):
    reports = {
        37: "Member Directory",
        52: "Appointments Report",
        72: "Permit Report",
        76: "Disclosure Report",
        100: "Disclosure Management Report",
    }

    headers = {
        'Auth': jk_hash(logon)
    }
    params = {
        "pReportNumber": f"{52}",
        "pMemberRoleNumber": f"{logon.mrn}",
        # "__": "~",  # This is in the JS source but seems unnecessary
        "x1": f"{logon.cn}",
        "x2": f"{logon.jk}",
        "x3": f"{logon.mrn}",
    }
    print('Getting report token')
    rep = logon.get("https://compass.scouts.org.uk/JSon.svc/ReportToken", headers=headers, params=params)
    rep.raise_for_status()  # TODO json result could be -1 to -4 as well, check for those

    run_report_url = rep.json().get('d')

    run_report_data = {
        # "ReportViewer1$ctl04$ctl07$txtValue": "Selected Level Only, Aire Valley, Barnsley, Benton, Beverley And Hornsea, Bishop Auckland, Blacktoft Beacon, Blaydon And District, Blyth Valley, Bradford North, Bradford South, Brighouse, Castle Morpeth, Central Yorkshire, Central Yorkshire Directly Administered District, Chester-le-street, City of Hull, City of Newcastle, Cleveland, Crook And Weardale, Darlington And District, Derwentside, Directly Administered-Humberside, Doncaster Danum, Durham, Durham City And District, Easingwold, East Cleveland, Gateshead And District, Grimsby And Cleethorpes, Hadrian, Halifax, Harrogate And Nidderdale, Heavy Woollen, Holme Valley, Houghton-le-Spring, Huddersfield North, Huddersfield South East, Huddersfield South West, Humberside, Ingleborough, Keighley, Leeds Templars, Leven, Mid Northumberland, Middlesbrough, North Leeds, North Lincolnshire, North Northumberland, North Yorkshire, Northallerton, Northumberland, Pennine Calder, Peterlee, Pocklington, Pontefract & Castleford, Redcar And Eston, Richmondshire, Ripon And District, Rotherham, Ryedale, Scarborough And District, Seaham And District, Selby, Sheffield Don, Sheffield Hallam, Sheffield Norfolk, Sheffield Sheaf, Shire Oak (Leeds), South Craven, South Holderness, South Leeds & Morley, South Tyneside, South Yorkshire, Spen Valley, Stockton Thornaby And District, Sunderland, Tees Valley North, Teesdale, Tynemouth, Wakefield, Wansbeck, West Leeds, West Yorkshire, Wetherby, Wharfedale, Whitby And District, Whitley Bay And District, Wolds & Coast, York Ebor, York Minster",
        # "ReportViewer1$ctl04$ctl07$divDropDown$ctl01$HiddenIndices": "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90",

        "_S1": "_S1|ReportViewer1$ctl04$ctl00",
        "ReportViewer1$ctl03$ctl00": "",
        "ReportViewer1$ctl03$ctl01": "",
        "ReportViewer1$ctl10": "ltr",
        "ReportViewer1$ctl11": "standards",
        "ReportViewer1$AsyncWait$HiddenCancelField": "true",
        "ReportViewer1$ctl04$ctl03$ddValue": "1",
        "ReportViewer1$ctl04$ctl05$txtValue": "Regional Roles, Central Yorkshire, Cleveland, Durham, Humberside, North Yorkshire, Northumberland, South Yorkshire, West Yorkshire",
        "ReportViewer1$ctl04$ctl07$txtValue": "Selected Level Only, Aire Valley, Barnsley, Benton, Beverley And Hornsea, Bishop Auckland, Blacktoft Beacon, Blaydon And District, Blyth Valley, Bradford North, Bradford South, Brighouse, Castle Morpeth, Central Yorkshire, Central Yorkshire Directly Administered District, Chester-le-street, City of Hull, City of Newcastle, Cleveland, Crook And Weardale, Darlington And District, Derwentside, Directly Administered-Humberside, Doncaster Danum, Durham, Durham City And District, Easingwold, East Cleveland, Gateshead And District, Grimsby And Cleethorpes, Hadrian, Halifax, Harrogate And Nidderdale, Heavy Woollen, Holme Valley, Houghton-le-Spring, Huddersfield North, Huddersfield South East, Huddersfield South West, Humberside, Ingleborough, Keighley, Leeds Templars, Leven, Mid Northumberland, Middlesbrough, North Leeds, North Lincolnshire, North Northumberland, North Yorkshire, Northallerton, Northumberland, Pennine Calder, Peterlee, Pocklington, Pontefract & Castleford, Redcar And Eston, Richmondshire, Ripon And District, Rotherham, Ryedale, Scarborough And District, Seaham And District, Selby, Sheffield Don, Sheffield Hallam, Sheffield Norfolk, Sheffield Sheaf, Shire Oak (Leeds), South Craven, South Holderness, South Leeds & Morley, South Tyneside, South Yorkshire, Spen Valley, Stockton Thornaby And District, Sunderland, Tees Valley North, Teesdale, Tynemouth, Wakefield, Wansbeck, West Leeds, West Yorkshire, Wetherby, Wharfedale, Whitby And District, Whitley Bay And District, Wolds & Coast, York Ebor, York Minster",
        "ReportViewer1$ctl04$ctl09$txtValue": "Full, Provisional, Pre-Provisional",
        "ReportViewer1$ctl04$ctl11$ddValue": "3",
        "ReportViewer1$ctl04$ctl13$txtValue": "09/04/2020",
        "ReportViewer1$ctl04$ctl15$txtValue": "Membership Number, Forenames, Surname, Known as, Email, Phone Number, Address, Postcode, Disclosure Number, Disclosure Date, Disclosure Expiry, Role, Role Start Date, Role End Date, Role Status, Line Manager Number, Line Manager Name, Review Date, Role Region, Role County, County Section, Role District, District Section, Role Group, Scout Group Section, CE Check, Appointment Advisory Commitee Approval, Commissioner Approval, Committee Approval, References, Getting Started : Essential Info, Getting Started : Personal Learning Plan, Getting Started : Tools for the Role, Wood Badge, Safety Training completed date, Safeguarding Training completed date, First Aid Training completed date, Ongoing Learning Hours completed this year(hh:mm)",
        "ReportViewer1$ctl04$ctl17$ddValue": "2",
        "ReportViewer1$ctl04$ctl05$divDropDown$ctl01$HiddenIndices": "0,1,2,3,4,5,6,7,8",
        "ReportViewer1$ctl04$ctl07$divDropDown$ctl01$HiddenIndices": "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90",
        "ReportViewer1$ctl04$ctl09$divDropDown$ctl01$HiddenIndices": "0,1,2",
        "ReportViewer1$ctl04$ctl15$divDropDown$ctl01$HiddenIndices": "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37",
        "ReportViewer1$ToggleParam$store": "",
        "ReportViewer1$ToggleParam$collapse": "false",
        "ReportViewer1$ctl05$ctl00$CurrentPage": "",
        "ReportViewer1$ctl05$ctl03$ctl00": "",
        "ReportViewer1$ctl08$ClientClickedId": "",
        "ReportViewer1$ctl07$store": "",
        "ReportViewer1$ctl07$collapse": "false",
        "ReportViewer1$ctl09$VisibilityState$ctl00": "None",
        "ReportViewer1$ctl09$ScrollPosition": "",
        "ReportViewer1$ctl09$ReportControl$ctl02": "",
        "ReportViewer1$ctl09$ReportControl$ctl03": "",
        "ReportViewer1$ctl09$ReportControl$ctl04": "100",
        # "__EVENTTARGET": "ReportViewer1$ctl09$Reserved_AsyncLoadTarget",
        "__EVENTARGUMENT": "",
        "__LASTFOCUS": "",
        # "__VIEWSTATE": "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",
        "__VIEWSTATEGENERATOR": "0A46CF7E",
        "__ASYNCPOST": "true",
        "ReportViewer1$ctl04$ctl00": "View Report"
    }

    print('Generating report')
    report = logon.post(f"{CompassSettings.base_url}/{run_report_url}")
    report.raise_for_status()
    report2 = logon.post(f"{CompassSettings.base_url}/{run_report_url}", data=run_report_data)
    report2.raise_for_status()
    report_export_url = re.search(r'"ExportUrlBase":"(.*?)"', report2.text).group(1).encode().decode("unicode-escape")
    # report_export_url_prefix = report_export_url.split("?")[0][1:]
    # report_export_url_data = {param.split('=')[0]: param.split('=')[1] for param in report_export_url.split("?")[1].split('&')}
    # report_export_url_data["Format"] = "CSV"
    print('Exporting report')
    # report_csv_content = s.get(f"{CompassSettings.base_url}/{report_export_url_prefix}", params=report_export_url_data)
    report_csv_content = logon.get(f"{CompassSettings.base_url}{report_export_url}CSV")
    print('Saving report')
    with open('export_report all.csv', 'wb') as file:
        file.write(report_csv_content.content)

    # All works, but no control over what exported, currently using default settings.


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
    # compass_role_to_use = 'Country Scout Active Support Member'
    # compass_role_to_use = 'County Executive Committee Member'
    c_logon = CompassLogon(auth_keys, compass_role_to_use)
    hierarchy = CompassHierarchy(c_logon.session)
    people = CompassPeople(c_logon.session)

    # get_report(c_logon)

    # SCRATCH #
    leah_sier_id = 11861706
    a = people._roles_tab(leah_sier_id)
    b = people.get_member_data(leah_sier_id)
    print()

    # Get all units within a given OU
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
