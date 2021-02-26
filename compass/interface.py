import compass.core as ci


def compass_read(auth: tuple[str, str]):
    logon = ci.Logon(auth)
    people = ci.People(logon)

    member_number = logon.cn
    training_data = people._training_tab(member_number)
    permits_data = people._permits_tab(member_number)
    roles_detail = {role: people._scraper.get_roles_detail(role) for role in training_data.roles}

    obj = {
        # **training_data,
        "roles": training_data.roles,
        "plps": training_data.plps,
        "mandatory": training_data.mandatory,
        "permits": permits_data,
        "hierarchies": {role_id: detail["hierarchy"] for role_id, detail in roles_detail.items()},
    }

    return obj
