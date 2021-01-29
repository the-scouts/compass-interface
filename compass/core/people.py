from compass.core._scrapers.member import PeopleScraper
from compass.core.logon import Logon
from compass.core.utility import maybe_int

# SCRAPER CLASS - 1-1 mapping with compass to minimise calls
# MAIN CLASS - object/properties focused, with abstractions of actual calls
# UTILITY CLASS - get_member_data, get_roles_from_members, etc


class People:
    def __init__(self, session: Logon):
        """Constructor for People."""
        self._scraper = PeopleScraper(session.s)

    def get_roles(self, membership_num: int, keep_non_volunteer_roles: bool = False) -> list:
        response = self._scraper.get_roles_tab(membership_num, keep_non_volunteer_roles)

        role_list = []
        for role_number, role_dict in response.items():
            if not role_dict["can_view_details"]:
                continue

            role_detail = self._scraper.get_roles_detail(role_number)
            details = role_detail["details"]
            hierarchy = role_detail["hierarchy"]
            data = {
                "membership_number": membership_num,
                "role_title": role_dict.get("role_title"),
                "role_start": role_dict.get("role_start"),
                "role_end": role_dict.get("role_end"),
                "role_status": role_dict.get("role_status"),
                "line_manager_number": maybe_int(details.get("line_manager_number")),
                "line_manager": details.get("line_manager"),
                "review_date": details.get("review_date"),
                "organisation": hierarchy.get("organisation"),
                "region": hierarchy.get("region"),
                "county": hierarchy.get("county"),
                "district": hierarchy.get("district"),
                "group": hierarchy.get("group"),
                "section": hierarchy.get("section"),
                "ce_check": details.get("ce_check"),
                "appointment_panel_approval": details.get("appointment_panel_approval"),
                "commissioner_approval": details.get("commissioner_approval"),
                "committee_approval": details.get("committee_approval"),
                "references": details.get("references"),
                **role_detail["getting_started"],
                "training_completion_date": None,
            }
            role_list.append({k: v for k, v in data.items() if v})

        return role_list

    # See getRole in PGS\Needle
    def _roles_tab(self, membership_num: int, keep_non_volunteer_roles: bool = False) -> dict:
        """Gets the data from the Role tab in Compass for the specified member.

        Sanitises the data to a common format, and removes Occasional Helper, Network, and PVG roles by default.

        :param membership_num:
        :param keep_non_volunteer_roles:
        :return:
        """
        return self._scraper.get_roles_tab(membership_num, keep_non_volunteer_roles)

    def _training_tab(self, membership_num: int) -> dict:
        """Gets training tab data for a given member.

        :param membership_num: Compass ID
        :return:
        """
        return self._scraper.get_training_tab(membership_num)

    def _permits_tab(self, membership_num: int) -> list:
        return self._scraper.get_permits_tab(membership_num)


# class Member:
#     def personal_details(self):
#         pass
#
#     def role_details(self):
#         pass
#
#     def ongoing_learning(self):
#         pass
#
#     def training(self):
#         pass
#
#     def permits(self):
#         pass
#
#     # def awards(self):
#     #     pass
