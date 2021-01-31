import compass as ci
from compass.util import hierarchy

# Exporting Appointments report: 14.39s 13.73s 13.26s

if __name__ == "__main__":
    auth_keys = ("user", "pass")
    compass_role_to_use = "Regional Administrator"
    # compass_role_to_use = 'HQ Committee Member - Scout Grants Committee'
    # compass_role_to_use = 'Country Scout Active Support Member'
    # compass_role_to_use = 'County Executive Committee Member'
    # compass_read(auth_keys)
    c_logon = ci.Logon(auth_keys, compass_role_to_use)
    c_hierarchy = ci.Hierarchy(c_logon)
    # people = CompassPeople(c_logon.session)
    # b = people.get_member_data(12047820)
    # a = people._scraper.get_roles_detail(2155910)
    # a = people._scraper.get_roles_detail(760357)
    # a = people.get_member_data(760357)

    ci.reports.get_report(c_logon, "Region Appointments Report")
    print(f"Took {time.time() - start}s")

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

    # members_json = get_members_with_roles_in_unit(cook_meth_id)
    org_hierarchy = c_hierarchy.get_hierarchy(10000001, "Organisation")
    # a = c_hierarchy.get_hierarchy(10013849, "Group")

    u_hierarchy = hierarchy.HierarchyUtility(c_logon)
    # surrey_county_id = 10000115
    # cook_meth_id = 10013849
    # surrey_hierarchy = u_hierarchy.get_hierarchy(cook_meth_id, "Group")
    # table_surrey = u_hierarchy.hierarchy_to_dataframe(surrey_hierarchy)
    table_org = u_hierarchy.hierarchy_to_dataframe(org_hierarchy)
    # print(table_surrey)

    # Get all members within that OU  (5020s ~= 1.5 hours for FULL ORG)
    # surrey_members = u_hierarchy.get_all_members_table(cook_meth_id, table_surrey["compass"])
    all_members = u_hierarchy.get_all_members_table(cook_meth_id, table_org["compass"])

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

    # JS assets:
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/adultjoining.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/assignnewrole.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/Dates.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/extenders.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/Grids.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/hierarchy.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/jQuery191.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/master.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/memberprofile.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/membertraining.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/Menu.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/neworgentity.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/newpermit.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/newrole.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/Popup.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/QAS.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/reports.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/roles.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/Scouts.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/scoutsportal.js
    # https://compass.scouts.org.uk/Scripts_v4.06/JS/searchresults.js
