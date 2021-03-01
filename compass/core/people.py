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
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view personal
                data for the requested member.

        """
        return self._scraper.get_personal_tab(membership_num)

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
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
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
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view role data

        """
        return self._scraper.get_roles_detail(role_number)

    def permits(self, membership_num: int) -> schema.MemberPermitsList:
        """Gets permits tab data for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            A MemberPermitsList object containing all data.

        """
        return self._scraper.get_permits_tab(membership_num)

    def training(self, membership_num: int) -> schema.MemberTrainingTab:
        """Gets training tab data for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            A MemberTrainingTab object containing all data.

        """
        return self._scraper.get_training_tab(membership_num, ongoing_only=False)

    def ongoing_learning(self, membership_num: int) -> schema.MemberMOGLList:
        """Gets ongoing learning data for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            A MemberMOGLList object containing all data.

        """
        return self._scraper.get_training_tab(membership_num, ongoing_only=True)

    def awards(self, membership_num: int) -> list[schema.MemberAward]:
        """Gets awards tab data for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            A MemberAward object containing all data.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
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
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view
                disclosure data for the requested member.

        """
        return self._scraper.get_disclosures_tab(membership_num)

    def latest_disclosure(self, membership_num: int) -> Optional[schema.MemberDisclosure]:
        """Gets latest disclosure for a given member.

        Latest is defined as the expiry date that is furthest away.

        Args:
            membership_num: Membership Number to use

        Returns:
            A MemberDisclosure objects containing disclosure data.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view
                disclosure data for the requested member.

        """
        disclosures = self.disclosures(membership_num)
        date_map = {disc.expiry_date: disc for disc in disclosures if disc.expiry_date}
        return date_map.get(max(date_map.keys(), default=None))


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
