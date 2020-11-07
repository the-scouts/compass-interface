from compass.hierarchy import CompassHierarchy
from compass.logon import CompassLogon
from compass.people import CompassPeople
from compass.reports import get_report
# from interface import compass_read


if __name__ == '__main__':

    auth_keys = ['user', 'pass']
    compass_role_to_use = 'County Communications Manager - Member Communications Manager'


    # compass_role_to_use = 'HQ Committee Member - Scout Grants Committee'
    # compass_role_to_use = 'Country Scout Active Support Member'
    # compass_role_to_use = 'County Executive Committee Member'
    # compass_read(auth_keys)

    c_logon = CompassLogon(auth_keys, compass_role_to_use)

    hierarchy = CompassHierarchy(c_logon.session)
    people = CompassPeople(c_logon.session)


    # b = people._roles_tab(733004, True)
    # a = people._scraper.get_personal_tab(733004)
    # a = people.get_member_data(733004)

    #get_report(c_logon)

    print(people._scraper.get_personal_tab(662069))
    # print(hierarchy._get_all_members_in_hierarchy(10000114, ['10000114']))
    # print(hierarchy._scraper.get_members_with_roles_in_unit(10000114))

    # SCRATCH #
    # print(a)
    # print(b)

    # Get all units within a given OU
    # print("Compliance for Cook Meth")
    # cook_meth_compliance = create_compliance_data_for_unit(10013849)
    # cook_meth_compliance.to_csv("cmsg.csv", index=False, encoding="utf-8-sig")


    # suffolk_county_id = 10000114
    # suffolk_hierarchy = hierarchy.get_hierarchy(suffolk_county_id, "County")

    # table_suffolk = hierarchy.hierarchy_to_dataframe(suffolk_hierarchy)

    # print(hierarchy._get_all_members_in_hierarchy(10000114, table_suffolk['compass']))

    # print(table_suffolk)

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
