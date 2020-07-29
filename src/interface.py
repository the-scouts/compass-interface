from src.compass.logon import CompassLogon
from src.compass.people import CompassPeopleScraper


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

