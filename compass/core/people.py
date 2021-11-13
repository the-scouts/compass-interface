from __future__ import annotations

from typing import Optional, TYPE_CHECKING

from compass.core._scrapers.member import PeopleScraper
from compass.core._scrapers.member import STATUSES
from compass.core.schemas.member import TYPES_ROLE_STATUS

if TYPE_CHECKING:
    from collections.abc import Iterable

    from compass.core.logon import Logon
    from compass.core.schemas import member as schema

# SCRAPER CLASS - 1-1 mapping with compass to minimise calls
# MAIN CLASS - object/properties focused, with abstractions of actual calls
# UTILITY CLASS - get_member_data, get_roles_from_members, etc


class People:
    def __init__(self, session: Logon):
        """Constructor for People."""
        self._scraper = PeopleScraper(session._session)
        self.membership_number = session.membership_number

    def personal(self, membership_number: int) -> schema.MemberDetails:
        """Gets personal tab data for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            A MemberDetails object containing all data.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view personal
                data for the requested member.

        """
        return self._scraper.get_personal_tab(membership_number)

    # See getRole in PGS\Needle
    def roles(
        self,
        membership_number: int,
        keep_non_volunteer_roles: bool = False,
        only_active: bool = False,
        statuses: Optional[Iterable[TYPES_ROLE_STATUS]] = None,
    ) -> schema.MemberRolesCollection:
        """Gets the data from the Role tab in Compass for the specified member.

        Sanitises the data to a common format, and removes Occasional Helper, Network, and PVG roles by default.

        Args:
            membership_number: Membership Number to use
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
            # TODO look into `ROLE_HIDEME` in the roles rows - does this apply to (Pre-)Prov or just Closed/Cancelled?
            unique_statuses: Optional[set[str]] = STATUSES - {"Closed", "Cancelled"}
        elif statuses is None:
            unique_statuses = None
        else:
            unique_statuses = set(statuses)
        return self._scraper.get_roles_tab(membership_number, keep_non_volunteer_roles, unique_statuses)

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

    def permits(self, membership_number: int) -> list[schema.MemberPermit]:
        """Gets permits tab data for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            A MemberPermitsList object containing all data.

        """
        return self._scraper.get_permits_tab(membership_number)

    def training(self, membership_number: int) -> schema.MemberTrainingTab:
        """Gets training tab data for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            A MemberTrainingTab object containing all data.

        """
        return self._scraper.get_training_tab(membership_number, ongoing_only=False)

    def ongoing_learning(self, membership_number: int) -> schema.MemberMandatoryTraining:
        """Gets ongoing learning data for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            A MemberMOGLList object containing all data.

        """
        return self._scraper.get_training_tab(membership_number, ongoing_only=True)

    def awards(self, membership_number: int) -> list[schema.MemberAward]:
        """Gets awards tab data for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            A MemberAward object containing all data.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view awards
                data for the requested member.

        """
        return self._scraper.get_awards_tab(membership_number)

    def disclosures(self, membership_number: int) -> list[schema.MemberDisclosure]:
        """Gets disclosures tab data for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            A list of MemberDisclosure objects containing all data.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view
                disclosure data for the requested member.

        """
        return self._scraper.get_disclosures_tab(membership_number)

    def latest_disclosure(self, membership_number: int) -> Optional[schema.MemberDisclosure]:
        """Gets latest disclosure for a given member.

        Latest is defined as the expiry date that is furthest away.

        Args:
            membership_number: Membership Number to use

        Returns:
            A MemberDisclosure objects containing disclosure data.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view
                disclosure data for the requested member.

        """
        disclosures = self.disclosures(membership_number)
        date_map = {disc.expiry_date: disc for disc in disclosures if disc.expiry_date}
        if not date_map:
            return None
        return date_map[max(date_map)]


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
