import compass.core as ci


def compass_read(username: str, password: str, /):
    api = ci.login(username, password)

    member_number = api.user.membership_number
    training_data = api.people.training(member_number)
    permits_data = api.people.permits(member_number)
    roles_detail = {role: api.people.role_detail(role) for role in training_data.roles}

    obj = {
        # **training_data,
        "roles": training_data.roles,
        "plps": training_data.plps,
        "mandatory": training_data.mandatory,
        "permits": permits_data,
        "hierarchies": {role_id: detail["hierarchy"] for role_id, detail in roles_detail.items()},
    }

    return obj
