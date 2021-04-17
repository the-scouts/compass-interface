from __future__ import annotations

from typing import Optional, TYPE_CHECKING

from compass.core._scrapers import member as scraper

if TYPE_CHECKING:
    from compass.core.logon import Logon
    from compass.core.schemas import member as schema

# SCRAPER CLASS - 1-1 mapping with compass to minimise calls
# MAIN CLASS - object/properties focused, with abstractions of actual calls


class People:
    def __init__(self, session: Logon):
        """Constructor for People."""
        self._scraper = scraper.PeopleScraper(session._session)
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
        *,
        only_volunteer_roles: bool = True,
        only_active: bool = False,
    ) -> schema.MemberRolesCollection:
        """Gets the data from the Role tab in Compass for the given member.

        Parses the data to a common format, and removes Occasional Helper, PVG,
        Network, Council and Staff roles by default.

        Args:
            membership_number: Membership Number to use
            only_volunteer_roles: If True, only volunteer roles are returned,
                and Helper, Council, Network, etc are dropped.
            only_active: If True, inactive roles (Closed, Cancelled) are not
                returned.

        Returns:
            A MemberRolesDict object containing all data.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view roles
                data for the requested member.

        """
        roles_data = self._scraper.get_roles_tab(membership_number, only_volunteer_roles)
        if only_active is False:
            return roles_data
        # Role status filter
        status_blacklist = {"Closed", "Cancelled"}  # Inactive roles inferred from `ROLE_HIDEME` css class
        filtered_roles = {number: model for number, model in roles_data.roles.items() if model.role_status not in status_blacklist}
        # if role list hasn't changed return original model
        if filtered_roles.keys() == roles_data.roles.keys():
            return roles_data
        # don't mutate cached model
        return roles_data.__class__.parse_obj(roles_data.__dict__ | {"roles": filtered_roles})

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
        return self._scraper.get_training_tab(membership_number)

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

    # Convenience methods:

    def adult_service_length(self, membership_number: int) -> float:
        """Returns length of service in qualifying roles in years.

        Excludes non-volunteer roles (e.g. Occasional Helper, PVG, Network),
        and returns total membership duration in fractional years. Correctly
        accounts for role overlap and gaps in service, as well as role statuses

        Args:
            membership_number: Membership Number to use

        Returns:
            Length of service in fractional years

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                If the current user does not have permission to view roles
                data for the requested member.

        """
        return self._scraper.get_roles_tab(membership_number).membership_duration

    def ongoing_learning(self, membership_number: int) -> schema.MemberMandatoryTraining:
        """Gets ongoing learning data for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            A MemberMOGLList object containing all data.

        """
        return self._scraper.get_training_tab(membership_number).mandatory

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
        return date_map[max(date_map)] if date_map else None
