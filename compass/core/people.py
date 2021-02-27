from __future__ import annotations

from typing import get_args, Optional, TYPE_CHECKING

from compass.core._scrapers.member import PeopleScraper
from compass.core.schemas.member import TYPES_ROLE_STATUS

if TYPE_CHECKING:
    from collections.abc import Iterable

    from compass.core.logon import Logon
    from compass.core.schemas import member as schema

# SCRAPER CLASS - 1-1 mapping with compass to minimise calls
# MAIN CLASS - object/properties focused, with abstractions of actual calls
# UTILITY CLASS - get_member_data, get_roles_from_members, etc

STATUSES = set(get_args(TYPES_ROLE_STATUS))


class People:
    def __init__(self, session: Logon):
        """Constructor for People."""
        self._scraper = PeopleScraper(session.s, session.cn, session.mrn, session.jk)

    def personal(self, membership_num: int) -> schema.MemberDetails:
        """Gets personal tab data for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            A MemberDetails object containing all data.

        Raises:
            PermissionError:
                If the current user does not have permission to view personal
                data for the requested member.

        """
        return self._scraper.get_personal_tab(membership_num)

    def get_roles(self, membership_num: int, keep_non_volunteer_roles: bool = False) -> list[dict[str, object]]:  # TYPES_ISD
        response = self._scraper.get_roles_tab(membership_num, keep_non_volunteer_roles)

        role_list = []
        for role_number, role_dict in response:
            if not role_dict.can_view_details:
                continue

            role_detail = self._scraper.get_roles_detail(role_number)
            details = role_detail.details
            hierarchy = role_detail.hierarchy
            data = {
                "membership_number": membership_num,
                "role_title": role_dict.role_title,
                "role_start": role_dict.role_start,
                "role_end": role_dict.role_end,
                "role_status": role_dict.role_status,
                "line_manager_number": maybe_int(details.line_manager_number),
                "line_manager": details.line_manager,
                "review_date": details.review_date,
                "organisation": hierarchy.organisation,
                "region": hierarchy.region,
                "county": hierarchy.county,
                "district": hierarchy.district,
                "group": hierarchy.group,
                "section": hierarchy.section,
                "ce_check": details.ce_check,
                "appointment_panel_approval": details.appointment_panel_approval,
                "commissioner_approval": details.commissioner_approval,
                "committee_approval": details.committee_approval,
                "references": details.references,
                **role_detail.getting_started,
                "training_completion_date": None,
            }
            role_list.append({k: v for k, v in data.items() if v})

        return role_list

    # See getRole in PGS\Needle
    def roles(
        self,
        membership_num: int,
        keep_non_volunteer_roles: bool = False,
        only_active: bool = False,
        statuses: Optional[Iterable[TYPES_ROLE_STATUS]] = None,
    ) -> schema.MemberRolesDict:
        """Gets the data from the Role tab in Compass for the specified member.

        Sanitises the data to a common format, and removes Occasional Helper, Network, and PVG roles by default.

        Args:
            membership_num: Membership Number to use
            keep_non_volunteer_roles: Keep Helper (OH/PVG) & Network roles?
            only_active: Keep only active (Full, Provisional, Pre-Provisional) roles?
            statuses: Explicit set of role statuses to keep

        Returns:
            A MemberRolesDict object containing all data.

        Raises:
            PermissionError:
                If the current user does not have permission to view roles
                data for the requested member.

        """
        if only_active:
            statuses = STATUSES - {"Closed", "Cancelled"}
        return self._scraper.get_roles_tab(membership_num, keep_non_volunteer_roles, statuses)

    def role_detail(self, role_number: int) -> schema.MemberRolePopup:
        """Get detailed information for specified role.

         Make sure to check `MemberRoleCore.can_view_details` on each role, as
         you may not have permissions to view certain roles (if they are
         outside of your hierarchy, for example).

         Args:
             role_number: Role to query

        Returns:
            MemberRolePopup object with detail on the role

        Raises:
            PermissionError:
                If the current user does not have permission to view role data

        """
        return self._scraper.get_roles_detail(role_number)

    def training(self, membership_num: int) -> schema.MemberTrainingTab:
        """Gets training tab data for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            A MemberTrainingTab object containing all data.

        """
        return self._scraper.get_training_tab(membership_num, ongoing_only=False)

    def permits(self, membership_num: int) -> schema.MemberPermitsList:
        """Gets permits tab data for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            A MemberPermitsList object containing all data.

        """
        return self._scraper.get_permits_tab(membership_num)

    def awards(self, membership_num: int) -> list[schema.MemberAward]:
        """Gets awards tab data for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            A MemberAward object containing all data.

        Raises:
            PermissionError:
                If the current user does not have permission to view awards
                data for the requested member.

        """
        return self._scraper.get_awards_tab(membership_num)

    def disclosures(self, membership_num: int) -> list[schema.MemberDisclosure]:
        """Gets disclosures tab data for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            A list of MemberDisclosure objects containing all data.

        Raises:
            PermissionError:
                If the current user does not have permission to view
                disclosure data for the requested member.

        """
        return self._scraper.get_disclosures_tab(membership_num)


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
