import datetime

from src.compass.logon import CompassLogon
from src.compass.people import CompassPeopleScraper

date_zero = datetime.date(1900, 1, 1)
ogl_names_map = {"GDPR Training": "gdpr"}


def get_ongoing_learning_scraper(logon: CompassLogon) -> dict:
    people_scraper = CompassPeopleScraper(logon.session)
    ongoing = people_scraper.get_training_tab(logon.cn, ongoing_only=True)

    ongoing_learning = {"membership_number": logon.cn}
    for ogl_dict in ongoing.values():
        key = ogl_dict.get("name", "")
        value = ogl_dict.get("completed_date", date_zero)
        renamed_key = ogl_names_map.get(key, key).lower()
        ongoing_learning[renamed_key] = value

    return ongoing_learning
