import compass as ci


def compass_read(auth: list or tuple):
    logon = ci.Logon(auth)
    scraper = ci.People(logon)._scraper

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
