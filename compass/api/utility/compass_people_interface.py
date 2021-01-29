import datetime

import compass as ci

date_zero = datetime.date(1900, 1, 1)
ogl_names_map = {"GDPR Training": "gdpr"}


def get_ongoing_learning_scraper(logon: ci.Logon) -> dict:
    people_scraper = ci.People(logon)._scraper
    ongoing = people_scraper.get_training_tab(logon.cn, ongoing_only=True)

    ongoing_learning = {"membership_number": logon.cn}
    for ogl_dict in ongoing.values():
        key = ogl_dict.get("name", "")
        value = ogl_dict.get("completed_date", date_zero)
        renamed_key = ogl_names_map.get(key, key).lower()
        ongoing_learning[renamed_key] = value

    return ongoing_learning
