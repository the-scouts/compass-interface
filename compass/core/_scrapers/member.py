from __future__ import annotations

import re
import time
from typing import get_args, Literal, Optional, overload, TYPE_CHECKING, Union

from lxml import html

from compass.core.interface_base import InterfaceAuthenticated
from compass.core.logger import logger
from compass.core.schemas import member as schema
from compass.core.settings import Settings
from compass.core.utility import maybe_int
from compass.core.utility import parse
from compass.core.utility import validation_errors_logging

if TYPE_CHECKING:
    import datetime

    import requests

MEMBER_PROFILE_TAB_TYPES = Literal[
    "Personal", "Roles", "Permits", "Training", "Awards", "Emergency", "Comms", "Visibility", "Disclosures"
]

mogl_map = dict(
    SA="safety",
    SG="safeguarding",
    FA="first_aid",
)
mogl_types = {"gdpr", *mogl_map.values()}


class PeopleScraper(InterfaceAuthenticated):
    """Class directly interfaces with Compass operations to extract member data.

    Compass's MemberProfile.aspx has 13 tabs:
     1. Personal Details (No Key)
     2. Your Children (Page=CHILD)
     3. Roles (Page=ROLES)
     4. Permits (Page=PERMITS)
     5. Training (Page=TRAINING)
     6. Awards (Page=AWARDS)
     7. Youth Badges/Awards (Page=BADGES)
     8. Event Invitations (Page=EVENTS)
     9. Emergency Details (Page=EMERGENCY)
     10. Communications (Page=COMMS)
     11. Visibility (Page=VISIBILITY)
     12. Disclosures (Page=DISCLOSURES)
     13. Parents/Guardians (Page=PARENT)

    Of these, tabs 2, 7, 8, 13 are disabled functionality.
    Tab 11 (Visibility) is only shown on the members' own profile.

    For member-adjacent operations there are additional endpoints:
     - /Popups/Profile/AssignNewRole.aspx
     - /Popups/Maint/NewPermit.aspx
     - /Popups/Profile/EditProfile.aspx

    Currently we only use one of these endpoints (AssignNewRole), as all
    other data we need can be found from the MemberProfile tabs.

    All functions in the class output native types.
    """

    def __init__(self, session: requests.Session, member_number: int, role_number: int, jk: str):
        """Constructor for PeopleScraper.

        takes an initialised Session object from Logon
        """
        # pylint: disable=useless-super-delegation
        # Want to keep this method for future use
        super().__init__(session, member_number, role_number, jk)

    def _get_member_profile_tab(self, membership_num: int, profile_tab: MEMBER_PROFILE_TAB_TYPES) -> bytes:
        """Returns data from a given tab in MemberProfile for a given member.

        Args:
            membership_num: Membership Number to use
            profile_tab: Tab requested from Compass

        Returns:
            A dict with content and encoding, e.g.:

            {"content": b"...", "encoding": "utf-8"}

            Both keys will always be present.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            ValueError: The given profile_tab value is illegal

        """
        tab_upper: str = profile_tab.upper()  # No longer type MEMBER_PROFILE_TAB_TYPES as upper case
        tabs = tuple(tab.upper() for tab in get_args(MEMBER_PROFILE_TAB_TYPES))
        url = f"{Settings.base_url}/MemberProfile.aspx?CN={membership_num}"
        if tab_upper == "PERSONAL":  # Personal tab has no key so is a special case
            response = self._get(url)
        elif tab_upper in tabs:
            url += f"&Page={tab_upper}&TAB"
            response = self._get(url)
        else:
            raise ValueError(f"Specified member profile tab {profile_tab} is invalid. Allowed values are {tabs}")

        return response.content

    def get_personal_tab(self, membership_num: int) -> schema.MemberDetails:
        """Returns data from Personal Details tab for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            A dict mapping keys to the corresponding data from the personal
            data tab.

            E.g.:
            MemberDetails(
                membership_number=...,
                name="...",
                known_as="...",
                forenames="...",
                surname="...",
                birth_date=datetime.date(...),
                sex="...",
                nationality="...",
                ethnicity="...",
                religion="...",
                occupation="...",
                join_date=datetime.date(...),
                postcode="...",
                main_phone="...",
                main_email="..."
                address=...
            )


            Keys will be present only if valid data could be extracted and
            parsed from Compass.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                Access to the member is not given by the current authentication

        """
        # pylint: disable=too-many-locals
        response = self._get_member_profile_tab(membership_num, "Personal")

        tree = html.fromstring(response)

        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise PermissionError(f"You do not have permission to the details of {membership_num}")

        details: dict[str, Union[None, int, str, datetime.date]] = dict()

        # ### Extractors
        # ## Core:

        details["membership_number"] = membership_num

        # Name(s)
        names = tree.xpath("//title//text()")[0].strip().split(" ")[3:]
        details["forenames"] = names[0]
        details["surname"] = " ".join(names[1:])

        # Main Phone
        details["main_phone"] = tree.xpath('string(//*[text()="Phone"]/../../../td[3])')

        # Main Email
        details["main_email"] = tree.xpath('string(//*[text()="Email"]/../../../td[3])')

        # ## Core - Positional:

        # Full Name
        details["name"] = tree.xpath("string(//*[@id='divProfile0']//tr[1]/td[2]/label)")
        # Known As
        details["known_as"] = tree.xpath("string(//*[@id='divProfile0']//tr[2]/td[2]/label)")
        # Join Date  # TODO Unknown - take date from earliest role?
        join_date_str = tree.xpath("string(//*[@id='divProfile0']//tr[4]/td[2]/label)")
        details["join_date"] = parse(join_date_str) if join_date_str != "Unknown" else None

        # ## Position Varies, only if authorised:

        # Gender
        details["sex"] = tree.xpath("string(//*[@id='divProfile0']//*[text()='Gender:']/../../td[2])")
        # DOB
        details["birth_date"] = parse(tree.xpath("string(//*[@id='divProfile0']//*[text()='Date of Birth:']/../../td[2])"))
        # Nationality
        details["nationality"] = tree.xpath("string(//*[@id='divProfile0']//*[text()='Nationality:']/../../td[2])")
        # Ethnicity
        details["ethnicity"] = tree.xpath("normalize-space(//*[@id='divProfile0']//*[text()='Ethnicity:']/../../td[2])")
        # Religion
        details["religion"] = tree.xpath("normalize-space(//*[@id='divProfile0']//*[text()='Religion/Faith:']/../../td[2])")
        # Occupation
        details["occupation"] = tree.xpath("normalize-space(//*[@id='divProfile0']//*[text()='Occupation:']/../../td[2])")
        # Address
        original_address = tree.xpath('string(//*[text()="Address"]/../../../td[3])')
        address = original_address or ", .  "
        addr_main, addr_code = address.rsplit(". ", 1)
        postcode, country = addr_code.rsplit(" ", 1)  # Split Postcode & Country
        try:
            street, town, county = addr_main.rsplit(", ", 2)  # Split address lines
        except ValueError:
            street, town = addr_main.rsplit(", ", 1)
            county = None
        details["address"] = original_address or None
        details["country"] = country or None
        details["postcode"] = postcode or None
        details["county"] = county or None
        details["town"] = town or None
        details["street"] = street or None

        # Filter out keys with no value.
        details = {k: v for k, v in details.items() if v}
        with validation_errors_logging(membership_num):
            return schema.MemberDetails.parse_obj(details)

    def get_roles_tab(
        self, membership_num: int, keep_non_volunteer_roles: bool = False, statuses: Optional[set] = None
    ) -> schema.MemberRolesDict:
        """Returns data from Roles tab for a given member.

        Sanitises the data to a common format, and removes Occasional Helper, Network, and PVG roles by default.

        Args:
            membership_num: Membership Number to use
            keep_non_volunteer_roles: Keep Helper (OH/PVG) & Network roles?
            statuses: Explicit set of role statuses to keep

        Returns:
            A dict of dicts mapping keys to the corresponding data from the roles tab.

            E.g.:
            {1234578:
             {'role_number': 1234578,
              'membership_number': ...,
              'role_title': '...',
              'role_class': '...',
              'role_type': '...',
              'location_id': ...,
              'location_name': '...',
              'role_start_date': datetime.datetime(...),
              'role_end': datetime.datetime(...),
              'role_status': '...'},
             {...}
            }


            Keys will always be present.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                Access to the member is not given by the current authentication

        Todo:
            primary_role

        """
        # pylint: disable=too-many-locals
        # Want to keep all functionality in one place, to reduce the number of
        # calls to Compass.
        # TODO could refactor some internals into helper functions
        logger.debug(f"getting roles tab for member number: {membership_num}")
        response = self._get_member_profile_tab(membership_num, "Roles")
        tree = html.fromstring(response)

        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise PermissionError(f"You do not have permission to the details of {membership_num}")

        statuses_set = statuses is not None

        roles_data = {}
        rows = tree.xpath("//tbody/tr")
        for row in rows:
            # Get children (cells in row)
            cells = list(row)  # filter out empty elements

            # If current role allows selection of role for editing, remove tickbox
            if any(el.tag == "input" for el in cells[0]):
                cells.pop(0)

            role_number = int(row.get("data-pk"))
            status_with_review = cells[5].text_content().strip()
            if status_with_review.startswith("Full Review Due ") or status_with_review.startswith("Full Ending "):
                role_status = "Full"
                review_date = parse(status_with_review.removeprefix("Full Review Due ").removeprefix("Full Ending "))
            else:
                role_status = status_with_review
                review_date = None

            role_details = dict(
                role_number=role_number,
                membership_number=membership_num,
                role_title=cells[0].text_content().strip(),
                role_class=cells[1].text_content().strip(),
                # role_type only visible if access to System Admin tab
                role_type=[*row.xpath("./td[1]/*/@title"), None][0],
                # location_id only visible if role is in hierarchy AND location still exists
                location_id=cells[2][0].get("data-ng_id"),
                location_name=cells[2].text_content().strip(),
                role_start=parse(cells[3].text_content().strip()),
                role_end=parse(cells[4].text_content().strip()),
                role_status=role_status,
                review_date=review_date,
                can_view_details=any("VIEWROLE" in el.get("class") for el in cells[6]),
            )
            # Remove OHs etc from list
            if not keep_non_volunteer_roles and (
                "helper" in role_details["role_class"].lower()
                or {role_details["role_title"].lower()} <= {"occasional helper", "pvg", "network member"}
            ):
                continue

            # Role status filter
            if statuses_set and role_status not in statuses:
                continue

            roles_data[role_number] = role_details

        with validation_errors_logging(membership_num):
            return schema.MemberRolesDict.parse_obj(roles_data)

    def get_permits_tab(self, membership_num: int) -> schema.MemberPermitsList:
        """Returns data from Permits tab for a given member.

        If a permit has been revoked, the expires value is None and the status is PERM_REV

        Args:
            membership_num: Membership Number to use

        Returns:
            A list of dicts mapping keys to the corresponding data from the
            permits tab.

            Keys will always be present.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        response = self._get_member_profile_tab(membership_num, "Permits")
        tree = html.fromstring(response)

        # Get rows with permit content
        rows = tree.xpath('//table[@id="tbl_p4_permits"]//tr[@class="msTR msTRPERM"]')

        permits = []
        for row in rows:
            permit: dict[str, Union[None, int, str, datetime.date]] = dict(membership_number=membership_num)
            child_nodes = list(row)
            permit["permit_type"] = child_nodes[1].text_content()
            permit["category"] = child_nodes[2].text_content()
            permit["type"] = child_nodes[3].text_content()
            permit["restrictions"] = child_nodes[4].text_content()
            expires = child_nodes[5].text_content()
            permit["expires"] = parse(expires) if expires != "Revoked" else None
            permit["status"] = child_nodes[5].get("class")

            permits.append(permit)

        with validation_errors_logging(membership_num):
            return schema.MemberPermitsList.parse_obj(permits)

    @overload
    def get_training_tab(self, membership_num: int, ongoing_only: Literal[True]) -> schema.MemberMOGLList:
        ...

    @overload
    def get_training_tab(self, membership_num: int, ongoing_only: Literal[False]) -> schema.MemberTrainingTab:
        ...

    @overload
    def get_training_tab(self, membership_num: int, ongoing_only: bool) -> Union[schema.MemberTrainingTab, schema.MemberMOGLList]:
        ...

    def get_training_tab(
        self, membership_num: int, ongoing_only: bool = False
    ) -> Union[schema.MemberTrainingTab, schema.MemberMOGLList]:
        """Returns data from Training tab for a given member.

        Args:
            membership_num: Membership Number to use
            ongoing_only: Return a dataframe of role training & OGL info? Otherwise returns all data

        Returns:
            A dict mapping keys to the corresponding data from the training
            tab.

            E.g.:
            {'roles': {1234567: {'role_number': 1234567,
               'role_title': '...',
               'role_start': datetime.datetime(...),
               'role_status': '...',
               'location': '...',
               'ta_data': '...',
               'ta_number': '...',
               'ta_name': '...',
               'completion': '...',
               'wood_badge_number': '...'},
              ...},
             'plps': {1234567: [{'pk': 6142511,
                'module_id': ...,
                'code': '...',
                'name': '...',
                'learning_required': False,
                'learning_method': '...',
                'learning_completed': '...',
                'validated_membership_number': '...',
                'validated_name': '...'},
               ...],
              ...},
             'mandatory': {'GDPR':
              {'name': 'GDPR',
              'completed_date': datetime.datetime(...)},
              ...}}

            Keys will always be present.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        # pylint: disable=too-many-locals,too-many-statements
        # Want to keep all functionality in one place, to reduce the number of
        # calls to Compass.
        # TODO could refactor some internals into helper functions
        logger.debug(f"getting training tab for member number: {membership_num}")

        response = self._get_member_profile_tab(membership_num, "Training")
        tree = html.fromstring(response)

        rows = tree.xpath("//table[@id='tbl_p5_TrainModules']/tr")

        training_plps = {}
        training_roles = {}
        for row in rows:
            # Personal Learning Plan (PLP) data
            if "trPLP" in row.classes:
                plp = row
                plp_table = plp.getchildren()[0].getchildren()[0]
                plp_data = []
                for module_row in plp_table:
                    if module_row.get("class") != "msTR trMTMN":
                        continue

                    module_data: dict[str, Union[None, int, str, datetime.date]] = {}
                    child_nodes = list(module_row)
                    module_data["pk"] = int(module_row.get("data-pk"))
                    module_data["module_id"] = int(child_nodes[0].get("id")[4:])
                    matches = re.match(r"^([A-Z0-9]+) - (.+)$", child_nodes[0].text_content()).groups()
                    if matches:
                        code = str(matches[0])
                        module_data["code"] = code
                        module_data["name"] = matches[1]

                        # Skip processing if we only want ongoing learning data and the module is not GDPR.
                        if ongoing_only and "gdpr" not in code.lower():
                            continue

                    learning_required = child_nodes[1].text_content().lower()
                    module_data["learning_required"] = "yes" in learning_required if learning_required else None
                    module_data["learning_method"] = child_nodes[2].text_content() or None
                    module_data["learning_completed"] = parse(child_nodes[3].text_content())
                    module_data["learning_date"] = parse(child_nodes[3].text_content())

                    validated_by_string = child_nodes[4].text_content()
                    if validated_by_string:
                        # Add empty item to prevent IndexError
                        validated_by_data = validated_by_string.split(" ", maxsplit=1) + [""]
                        module_data["validated_membership_number"] = maybe_int(validated_by_data[0])
                        module_data["validated_name"] = validated_by_data[1]
                    module_data["validated_date"] = parse(child_nodes[5].text_content())

                    plp_data.append(module_data)

                training_plps[int(plp_table.get("data-pk"))] = plp_data

            # Role data
            if "msTR" in row.classes:
                role = row

                child_nodes = list(role)

                info: dict[str, Union[None, str, int, datetime.date]] = {}  # NoQA

                info["role_number"] = int(role.xpath("./@data-ng_mrn")[0])
                info["role_title"] = child_nodes[0].text_content()
                info["role_start"] = parse(child_nodes[1].text_content())
                status_with_review = child_nodes[2].text_content()
                # TODO for `Ending: blah` roles, should we store the ending date?
                if status_with_review.startswith("Full (Review Due: ") or status_with_review.startswith("Full (Ending: "):
                    info["role_status"] = "Full"
                    date_str = status_with_review.removeprefix("Full (Review Due: ").removeprefix("Full (Ending: ").rstrip(")")
                    info["review_date"] = parse(date_str)
                else:
                    info["role_status"] = status_with_review
                    info["review_date"] = None

                info["location"] = child_nodes[3].text_content()

                training_advisor_string = child_nodes[4].text_content()
                if training_advisor_string:
                    info["ta_data"] = training_advisor_string
                    # Add empty item to prevent IndexError
                    training_advisor_data = training_advisor_string.split(" ", maxsplit=1) + [""]
                    info["ta_number"] = maybe_int(training_advisor_data[0])
                    info["ta_name"] = training_advisor_data[1]

                completion_string = child_nodes[5].text_content()
                if completion_string:
                    info["completion"] = completion_string
                    parts = completion_string.split(":")
                    info["completion_type"] = parts[0].strip()
                    info["completion_date"] = parse(parts[1].strip())
                    assert len(parts) <= 2, parts[2:]
                    # info["ct"] = parts[3:]  # TODO what is this? From CompassRead.php
                info["wood_badge_number"] = child_nodes[5].get("id", "").removeprefix("WB_") or None

                training_roles[info["role_number"]] = info

        # Handle GDPR:
        # Get latest GDPR date
        gdpr_dates = [mod["validated_date"] for plp in training_plps.values() for mod in plp if mod["code"] == "GDPR"]
        training_ogl = {"gdpr": dict(completed_date=next(reversed(sorted(date for date in gdpr_dates if date is not None)), None))}
        for ongoing_learning in tree.xpath("//tr[@data-ng_code]"):
            cell_text = {c.get("id", "<None>").split("_")[0]: c.text_content() for c in ongoing_learning}

            training_ogl[mogl_map[ongoing_learning.get("data-ng_code")]] = dict(
                completed_date=parse(cell_text.get("tdLastComplete")),
                renewal_date=parse(cell_text.get("tdRenewal")),
            )
            # TODO missing data-pk from list(cell)[0].tag == "input", and module names/codes. Are these important?

        # Update training_ogl with missing mandatory ongoing learning types
        training_ogl |= {missing_mogl_type: dict() for missing_mogl_type in mogl_types - training_ogl.keys()}

        if ongoing_only:
            with validation_errors_logging(membership_num):
                return schema.MemberMOGLList.parse_obj(training_ogl)

        training_data = {
            "roles": training_roles,
            "plps": training_plps,
            "mandatory": training_ogl,
        }

        with validation_errors_logging(membership_num):
            return schema.MemberTrainingTab.parse_obj(training_data)

    def get_awards_tab(self, membership_num: int) -> list[schema.MemberAward]:
        """Returns data from Awards tab for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            A MemberAward object with corresponding data from the awards tab.

            E.g.:
            MemberAward(
                membership_number=...,
                type="...",
                location="...",
                date=datetime.date(...),
            )

            Keys will always be present.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        response = self._get_member_profile_tab(membership_num, "Awards")
        tree = html.fromstring(response)

        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise PermissionError(f"You do not have permission to the details of {membership_num}")

        awards = []
        rows = tree.xpath("//table[@class='msAward']/tr")
        with validation_errors_logging(membership_num):
            for row in rows:
                award_props = row[1][0]  # Properties are stored as yet another sub-table
                award_data = schema.MemberAward(
                    membership_number=membership_num,
                    type=award_props[0][1].text_content(),
                    location=award_props[1][1].text_content() or None,
                    date=parse(award_props[2][1].text_content() or ""),
                )
                awards.append(award_data)
        return awards

    def get_disclosures_tab(self, membership_num: int) -> list[schema.MemberDisclosure]:
        """Returns data from Disclosures tab for a given member.

        Args:
            membership_num: Membership Number to use

        Returns:
            A MemberAward object with corresponding data from the disclosures
            tab.

            E.g.:
            MemberDisclosure(
                membership_number=...,
                country="...",
                provider="...",
                type="...",
                number=...,
                issuer="...",
                issue_date=datetime.date(...),
                status="...",
                expiry_date=datetime.date(...),
            )

            Keys will always be present.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        response = self._get_member_profile_tab(membership_num, "Disclosures")
        tree = html.fromstring(response)

        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise PermissionError(f"You do not have permission to the details of {membership_num}")

        disclosures = []
        rows = tree.xpath("//tbody/tr")
        with validation_errors_logging(membership_num):
            for row in rows:
                # Get children (cells in row)
                cells = list(row)

                disclosure = schema.MemberDisclosure(
                    membership_number=membership_num,
                    country=cells[0].text_content() or None,  # Country sometimes missing (Application Withdrawn)
                    provider=cells[1].text_content(),
                    type=cells[2].text_content(),
                    number=cells[3].text_content() or None,  # If Application Withdrawn, no disclosure number
                    issuer=cells[4].text_content() or None,
                    issue_date=parse(cells[5].text_content()),  # If Application Withdrawn, maybe no issue date
                    status=cells[6].text_content(),
                    expiry_date=parse(cells[7].text_content()),  # If Application Withdrawn, no expiry date
                )
                disclosures.append(disclosure)
        return disclosures

    # See getAppointment in PGS\Needle
    def get_roles_detail(
        self, role_number: int, response: Union[None, str, bytes, requests.Response] = None
    ) -> schema.MemberRolePopup:
        """Returns detailed data from a given role number.

        Args:
            role_number: Role Number to use
            response: Pre-generated response to use

        Returns:
            A dicts mapping keys to the corresponding data from the
            role detail data.

            E.g.:
            {'hierarchy': {'organisation': 'The Scout Association',
              'country': '...',
              'region': '...',
              'county': '...',
              'district': '...',
              'group': '...',
              'section': '...'},
             'details': {'role_number': ...,
              'organisation_level': '...',
              'birth_date': datetime.datetime(...),
              'membership_number': ...,
              'name': '...',
              'role_title': '...',
              'role_start': datetime.datetime(...),
              'role_status': '...',
              'line_manager_number': ...,
              'line_manager': '...',
              'ce_check': datetime.datetime(...),
              'disclosure_check': '...',
              'references': '...',
              'appointment_panel_approval': '...',
              'commissioner_approval': '...',
              'committee_approval': '...'},
             'getting_started': {...: {'name': '...',
               'validated': datetime.datetime(...),
               'validated_by': '...'},
               ...
              }}

            Keys will always be present.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        # pylint: disable=too-many-locals,too-many-statements
        # Want to keep all functionality in one place, to reduce the number of
        # calls to Compass.
        # TODO could refactor some internals into helper functions
        renamed_levels = {
            "County / Area / Scottish Region / Overseas Branch": "County",
        }
        renamed_modules = {
            "001": "module_01",
            "TRST": "trustee_intro",
            "002": "module_02",
            "003": "module_03",
            "004": "module_04",
            "GDPR": "GDPR",
            "SFTY": "safety",
            "SAFE": "safeguarding",
        }
        unset_vals = {"--- Not Selected ---", "--- No Items Available ---", "--- No Line Manager ---"}

        module_names = {
            "Essential Information": "M01",
            "Trustee Introduction": "TRST",
            "Personal Learning Plan": "M02",
            "Tools for the Role (Section Leaders)": "M03",
            "Tools for the Role (Managers and Supporters)": "M04",
            "General Data Protection Regulations": "GDPR",
            "Safety Training": "SFTY",
            "Safeguarding Training": "SAFE",
        }

        references_codes = {
            "NC": "Not Complete",
            "NR": "Not Required",
            "RR": "References Requested",
            "S": "References Satisfactory",
            "U": "References Unsatisfactory",
        }

        start_time = time.time()
        if response is None:
            response = self._get(f"{Settings.base_url}/Popups/Profile/AssignNewRole.aspx?VIEW={role_number}")
            logger.debug(f"Getting details for role number: {role_number}. Request in {(time.time() - start_time):.2f}s")

        post_response_time = time.time()
        if isinstance(response, (str, bytes)):
            tree = html.fromstring(response)
        else:
            tree = html.fromstring(response.content)
        form = tree.forms[0]
        inputs = form.inputs
        fields = form.fields

        if form.action == "./ScoutsPortal.aspx?Invalid=Access":
            raise PermissionError(f"You do not have permission to the details of role {role_number}")

        member_string = fields.get("ctl00$workarea$txt_p1_membername")
        ref_code = fields.get("ctl00$workarea$cbo_p2_referee_status")

        role_details: dict[str, Union[None, int, str, datetime.date]] = dict()
        # Approval and Role details
        role_details["role_number"] = role_number
        role_details["organisation_level"] = fields.get("ctl00$workarea$cbo_p1_level")
        role_details["birth_date"] = parse(inputs["ctl00$workarea$txt_p1_membername"].get("data-dob")) if Settings.debug else None
        role_details["membership_number"] = int(fields.get("ctl00$workarea$txt_p1_memberno"))
        role_details["name"] = member_string.split(" ", maxsplit=1)[1]  # TODO does this make sense - should name be in every role??
        role_details["role_title"] = fields.get("ctl00$workarea$txt_p1_alt_title")
        role_details["role_start"] = parse(fields.get("ctl00$workarea$txt_p1_startdate"))
        # Role Status
        role_details["role_status"] = fields.get("ctl00$workarea$txt_p2_status")
        # Line Manager
        line_manager_el = next((op for op in inputs["ctl00$workarea$cbo_p2_linemaneger"] if op.get("selected")), None)
        role_details["line_manager_number"] = maybe_int(line_manager_el.get("value")) if line_manager_el is not None else None
        role_details["line_manager"] = line_manager_el.text.strip() if line_manager_el is not None else None
        # Review Date
        role_details["review_date"] = parse(fields.get("ctl00$workarea$txt_p2_review"))
        # CE (Confidential Enquiry) Check  # TODO if CE check date != current date then is valid
        ce_check = fields.get("ctl00$workarea$txt_p2_cecheck")
        role_details["ce_check"] = parse(ce_check) if ce_check != "Pending" else None
        # Disclosure Check
        disclosure_with_date = fields.get("ctl00$workarea$txt_p2_disclosure", "")
        if disclosure_with_date.startswith("Disclosure Issued : "):
            disclosure_date = parse(disclosure_with_date.removeprefix("Disclosure Issued : "))
            disclosure_check = "Disclosure Issued"
        else:
            disclosure_date = None
            disclosure_check = disclosure_with_date or None
        role_details["disclosure_check"] = disclosure_check
        role_details["disclosure_date"] = disclosure_date
        # References
        role_details["references"] = references_codes.get(ref_code, ref_code)

        approval_values = {}
        for row in tree.xpath("//tr[@class='trProp']"):
            select = row[1][0]
            code = select.get("data-app_code")
            approval_values[code] = select.get("data-db")
            # select.get("title") gives title text, but this is not useful as it does not reflect latest changes,
            # but only who added the role to Compass.

        # Appointment Panel Approval
        role_details["appointment_panel_approval"] = approval_values.get("ROLPRP|AACA")
        # Commissioner Approval
        role_details["commissioner_approval"] = approval_values.get("ROLPRP|CAPR")
        # Committee Approval
        role_details["committee_approval"] = approval_values.get("ROLPRP|CCA")

        if role_details["line_manager_number"] in unset_vals:
            role_details["line_manager_number"] = None

        # Filter null values
        role_details = {k: v for k, v in role_details.items() if v is not None}

        # Getting Started
        modules_output = {}
        getting_started_modules = tree.xpath("//tr[@class='trTrain trTrainData']")
        # Get all training modules and then extract the required modules to a dictionary
        for module in getting_started_modules:
            module_name = module[0][0].text.strip()
            if module_name in module_names:
                info = {
                    # "name": module_names[module_name],  # short_name
                    "validated": parse(module[2][0].value),  # Save module validation date
                    "validated_by": module[1][1].get("value") or None,  # Save who validated the module
                }
                mod_code: str = module[2][0].get("data-ng_value")
                modules_output[renamed_modules[mod_code]] = info

        # Get all levels of the org hierarchy and select those that will have information:
        # Get all inputs with location data
        org_levels = [v for k, v in sorted(dict(inputs).items()) if "ctl00$workarea$cbo_p1_location" in k]
        # TODO
        all_locations = {row.get("title"): row.findtext("./option") for row in org_levels}

        clipped_locations = {
            renamed_levels.get(key, key).lower(): value for key, value in all_locations.items() if value not in unset_vals
        }

        logger.debug(
            f"Processed details for role number: {role_number}. "
            f"Compass: {(post_response_time - start_time):.3f}s; Processing: {(time.time() - post_response_time):.4f}s"
        )
        # TODO data-ng_id?, data-rtrn_id?
        full_details = {
            "hierarchy": clipped_locations,
            "details": role_details,
            "getting_started": modules_output,
        }
        with validation_errors_logging(role_number, name="Role Number"):
            return schema.MemberRolePopup.parse_obj(full_details)
