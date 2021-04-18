from __future__ import annotations

import datetime
import re
from typing import get_args, Literal, Optional, TYPE_CHECKING, TypedDict, Union

from lxml import html

from compass.core import errors
from compass.core.interface_base import InterfaceBase
from compass.core.logger import logger
from compass.core.schemas import member as schema
from compass.core.settings import Settings
from compass.core.util import cache_hooks
from compass.core.util.context_managers import validation_errors_logging
from compass.core.util.type_coercion import maybe_int
from compass.core.util.type_coercion import parse

if TYPE_CHECKING:
    from collections.abc import Iterable
    from collections.abc import Iterator

    TYPES_TRAINING_MODULE = dict[str, Union[None, int, str, datetime.date]]
    TYPES_TRAINING_PLPS = dict[int, list[TYPES_TRAINING_MODULE]]
    TYPES_TRAINING_OGL_DATES = dict[Literal["completed_date", "renewal_date"], Optional[datetime.date]]
    TYPES_TRAINING_OGL = dict[str, TYPES_TRAINING_OGL_DATES]

# _get_member_profile_tab
MEMBER_PROFILE_TAB_TYPES = Literal[
    "Personal", "Roles", "Permits", "Training", "Awards", "Emergency", "Comms", "Visibility", "Disclosures"
]
TABS = {tab.upper() for tab in get_args(MEMBER_PROFILE_TAB_TYPES)}

# get_roles_tab
ROLE_STATUSES = set(get_args(schema.TYPES_ROLE_STATUS))
NON_VOLUNTEER_TITLES = {
    # occasional helper roles:
    "group occasional helper",
    "group occasional helper.",
    "district occasional helper",
    "county occasional helper",
    "country occasional helper",
    # pvg roles:
    "group non member pvg only"
    "group non member pvg only (prov)"
    "group non member pvg only (pre-prov)"
    "group non memberdetails pvg only"
    "district non member pvg only"
    "scotland region non-member pvg"
    "non member pvg only"
    "non member pvg only (prov)"
    "non member pvg only (pre-prov)"
    # council roles:
    "county scout council member",
    "county scout council member - nominated representative",
    "county scout council member - nominated youth representative",
    "county scout council member - nominated member (18-24)",
    "country scout council member - nominated representative",
    "scotland region scout council member",
    "scotland region scout council member - nominated representative ",
    "scotland region scout council member - nominated youth representative ",
    "tsa council member",
    "tsa council member - elected member",
    "tsa council member - ex-officio member",
    "tsa council member - nominated member",
    "tsa council member - nominated member (18-24)",
    # staff roles:
    "district staff",
    "county staff",
    # network member roles:
    "network member",  # TODO is this ever a role title?
    "scout network member",
    "district scout network",
    "district scout network member",
    "county scout network member",
    "bso scout network member",
}

# get_training_tab
mogl_modules = {
    "SA": "safety",
    "SG": "safeguarding",
    "FA": "first_aid",
    "gdpr": "gdpr",  # phony entry, used for key
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


class PeopleScraper(InterfaceBase):
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

    def _get_member_profile_tab(self, membership_number: int, profile_tab: MEMBER_PROFILE_TAB_TYPES) -> bytes:
        """Returns data from a given tab in MemberProfile for a given member.

        Args:
            membership_number: Membership Number to use
            profile_tab: Tab requested from Compass

        Returns:
            Response from the remote server as bytes serialised blob

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            CompassError: The given profile_tab value is illegal

        """
        tab_upper: str = profile_tab.upper()  # No longer type MEMBER_PROFILE_TAB_TYPES as upper case
        url = f"{Settings.base_url}/MemberProfile.aspx?CN={membership_number}"
        if tab_upper in TABS:
            url += f"&Page={tab_upper}&TAB"
        elif tab_upper != "PERSONAL":  # Personal tab has no key so is a special case
            raise errors.CompassError(f"Specified member profile tab {profile_tab} is invalid. Allowed values are {TABS}")

        return self.s.get(url).content

    @cache_hooks.cache_result(key=("personal", 1))
    def get_personal_tab(self, membership_number: int, /) -> schema.MemberDetails:
        """Returns data from Personal Details tab for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            A MemberDetails object keys to the corresponding data from the personal
            data tab:

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
                address=MemberDetailsAddress(...)
            )

            Keys will be present only if valid data could be extracted and
            parsed from Compass.

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                Access to the member is not given by the current authentication

        """
        response = self._get_member_profile_tab(membership_number, "Personal")
        tree = html.fromstring(response)
        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise errors.CompassPermissionError(f"You do not have permission to the details of {membership_number}")

        details: dict[str, Union[None, int, str, datetime.date, _AddressData, dict[str, str]]] = dict()

        # ### Extractors
        # ## Core:
        details["membership_number"] = membership_number
        names = next(tree.iter("title")).text.strip().split(" ")[3:]  # ("Scout", "-", membership_number, *names)
        details["forenames"] = names[0]
        details["surname"] = " ".join(names[1:])

        # Full path is:
        # XP:   /html/body/form/div[5]/div[1]/div[2]/div[2]/div/div
        # CSS:  html body form div div#mstr_container div#mstr_panel div#mstr_scroll div#mstr_work div#mpage1.mpage
        div_profile_tbl = tree[1][0][5][0][1][2][0][0]
        personal_details: dict[str, str] = {row[0][0].text: row[1][0].text for row in div_profile_tbl[1][2][1][1][0]}
        if len(div_profile_tbl) >= 5:
            contact_details: dict[str, str] = {row[0][0][0].text: row[2][0].text for row in div_profile_tbl[5][2] if row[0]}
        else:
            contact_details = {}

        # ## Core - Positional:
        details["name"] = personal_details["Name:"]  # Full Name
        details["known_as"] = personal_details["Known As:"]
        join_date = personal_details["Date of Joining:"]  # TODO Unknown - take date from earliest role?
        details["join_date"] = parse(join_date) if join_date != "Unknown" else None

        # ## Core - Position Varies:
        details["sex"] = personal_details["Gender:"]

        # ## Additional - Position Varies, visible for most roles:
        details["address"] = _process_address(contact_details.get("Address", ""))
        details["main_phone"] = contact_details.get("Phone")
        details["main_email"] = contact_details.get("Email")

        # ## Additional - Position Varies, visible for admin roles (Manager, Administrator etc):
        details["birth_date"] = parse(personal_details.get("Date of Birth:", ""))
        details["nationality"] = personal_details.get("Nationality:", "").strip()
        details["ethnicity"] = personal_details.get("Ethnicity:", "").strip()
        details["religion"] = personal_details.get("Religion/Faith:", "").strip()
        details["occupation"] = personal_details.get("Occupation:", "").strip()

        # ## Other Sections (note double looping but hopefully not large impact)
        if len(div_profile_tbl) >= 17:  # As far as I know, the `other' sections are all-or-nothing, so we can skip to check hobbies
            details["disabilities"] = {k: v for k, _, v in (row[0][0].text.partition(" - ") for row in div_profile_tbl[9][2])}
            details["qualifications"] = {k: v for k, _, v in (row[0][0].text.partition(" - ") for row in div_profile_tbl[13][2])}
            details["hobbies"] = {k: v for k, _, v in (row[0][0].text.partition(" - ") for row in div_profile_tbl[17][2])}

        # Filter out keys with no value.
        details = {k: v for k, v in details.items() if v}

        # Filter out no-info sections. After the filter as empty here means we found the section, but it was empty
        for additional in ("disabilities", "qualifications", "hobbies"):
            if additional in details:
                add_sect: dict[str, str] = details[additional]  # type: ignore[assignment]
                if f"No {additional.title()} Entered" in add_sect:
                    details[additional] = {}

        with validation_errors_logging(membership_number):
            return schema.MemberDetails.parse_obj(details)

    @cache_hooks.cache_result(key=("roles", 1))
    def get_roles_tab(self, membership_number: int, /, only_volunteer_roles: bool = True) -> schema.MemberRolesCollection:
        """Returns data from Roles tab for a given member.

        Parses the data to a common format, and removes Occasional Helper, PVG,
        Network, Council and Staff roles by default.

        Args:
            membership_number: Membership Number to use
            only_volunteer_roles: If True, drop non-volunteer roles

        Returns:
            A MemberRolesCollection object with the data from the roles tab
            (keys will always be present):

            MemberRolesCollection(
                roles={
                    1234578: MemberRoleCore(
                        role_number=...,
                        membership_number=...,
                        role_title='...',
                        role_class='...',
                        role_type='...',
                        location_id=...,
                        location_name='...',
                        role_start=datetime.date(...),
                        role_end=datetime.date(...),
                        role_status='...',
                        review_date=datetime.date(...),
                        can_view_details=True|False
                    ),
                    ...
                },
                membership_duration=...,
                primary_role=...,
            )

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call
            PermissionError:
                Access to the member is not given by the current authentication

        """
        logger.debug(f"getting roles tab for member number: {membership_number}")

        response = self._get_member_profile_tab(membership_number, "Roles")
        tree = html.fromstring(response)
        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise errors.CompassPermissionError(f"You do not have permission to the details of {membership_number}")

        primary_role = None
        roles_dates = []
        roles_data = {}
        for row in tree.xpath("//tbody/tr"):
            # Get children (cells in row)
            cells = list(row)
            # If current role allows selection of role for editing, remove tickbox
            # If any role allows for selection, an additional column will be added
            # with empty table-cells where there is no tickbox. Also remove these.
            if any(el.tag == "input" for el in cells[0]) or cells[0].getchildren() == []:
                cells.pop(0)

            role_title, primary_role = _extract_primary_role(cells[0].text_content().strip(), primary_role)
            role_status, review_date = _extract_review_date(cells[5].text_content().strip())

            role_details = schema.MemberRoleCore(
                role_number=int(row.get("data-pk")),
                membership_number=membership_number,
                role_title=role_title,
                role_class=cells[1].text_content().strip(),
                # role_type only visible if access to System Admin tab
                role_type=cells[0][0].get("title", None),
                # location_id only visible if role is in hierarchy AND location still exists
                location_id=cells[2][0].get("data-ng_id"),
                location_name=cells[2].text_content().strip(),
                role_start=parse(cells[3].text_content().strip()),  # type: ignore[arg-type]
                role_end=parse(cells[4].text_content().strip()),
                role_status=role_status,
                review_date=review_date,
                can_view_details=any("VIEWROLE" in el.get("class") for el in cells[6]),
            )
            # Save role number if role is primary
            if primary_role is True:
                primary_role = role_details.role_number
            # Remove OHs etc from list
            if "helper" in role_details.role_class.lower() or role_details.role_title.lower() in NON_VOLUNTEER_TITLES:
                if only_volunteer_roles is True:
                    continue
            # If role is a full volunteer role, potentially add to date list
            elif role_status != "Cancelled":
                # If role_end is a falsy value (None), replace with today's date
                roles_dates.append((role_details.role_start, role_details.role_end or datetime.date.today()))

            roles_data[role_details.role_number] = role_details

        with validation_errors_logging(membership_number):
            # Calculate days of membership (inclusive), normalise to years.
            return schema.MemberRolesCollection(
                roles=roles_data,
                membership_duration=_membership_duration(roles_dates),
                primary_role=primary_role,
            )

    @cache_hooks.cache_result(key=("permits", 1))
    def get_permits_tab(self, membership_number: int, /) -> list[schema.MemberPermit]:
        """Returns data from Permits tab for a given member.

        If a permit has been revoked, the expires value is None and the status is PERM_REV

        Args:
            membership_number: Membership Number to use

        Returns:
            A list of dicts mapping keys to the corresponding data from the
            permits tab (keys will always be present).

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        response = self._get_member_profile_tab(membership_number, "Permits")
        tree = html.fromstring(response)

        # Get rows with permit content
        rows = tree.xpath('//table[@id="tbl_p4_permits"]//tr[@class="msTR msTRPERM"]')

        permits = []
        with validation_errors_logging(membership_number):
            for row in rows:
                child_nodes = list(row)
                expires = child_nodes[5].text_content()
                permits.append(
                    schema.MemberPermit(
                        membership_number=membership_number,
                        permit_type=child_nodes[1].text_content(),
                        category=child_nodes[2].text_content(),
                        type=child_nodes[3].text_content(),
                        restrictions=child_nodes[4].text_content(),
                        expires=parse(expires) if expires != "Revoked" else None,
                        status=child_nodes[5].get("class"),
                    )
                )
        return permits

    @cache_hooks.cache_result(key=("training", 1))
    def get_training_tab(self, membership_number: int, /) -> schema.MemberTrainingTab:
        """Returns data from Training tab for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            A model with the data from the training tab (keys will always be
            present):

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

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        logger.debug(f"getting training tab for member number: {membership_number}")

        response = self._get_member_profile_tab(membership_number, "Training")
        tree = html.fromstring(response)

        rows = tree.xpath("//table[@id='tbl_p5_TrainModules']/tr")

        training_plps: TYPES_TRAINING_PLPS = {}
        training_roles = {}
        for row in rows:
            classes = set(row.classes)

            # Personal Learning Plan (PLP) data
            if "trPLP" in classes:
                plp_number, plp_data = _process_personal_learning_plan(row)
                training_plps[plp_number] = plp_data

            # Role data
            if "msTR" in classes:
                role_number, role_data = _process_role_data(row)
                training_roles[role_number] = role_data

        details = {"roles": training_roles, "plps": training_plps, "mandatory": _compile_ongoing_learning(training_plps, tree)}
        with validation_errors_logging(membership_number):
            return schema.MemberTrainingTab.parse_obj(details)

    @cache_hooks.cache_result(key=("awards", 1))
    def get_awards_tab(self, membership_number: int, /) -> list[schema.MemberAward]:
        """Returns data from Awards tab for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            A MemberAward object with corresponding data from the awards tab
            (keys will always be present):

            MemberAward(
                membership_number=...,
                type="...",
                location="...",
                date=datetime.date(...),
            )

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        response = self._get_member_profile_tab(membership_number, "Awards")
        tree = html.fromstring(response)
        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise errors.CompassPermissionError(f"You do not have permission to the details of {membership_number}")

        awards = []
        rows = tree.xpath("//table[@class='msAward']/tr")
        with validation_errors_logging(membership_number):
            for row in rows:
                award_props = row[1][0]  # Properties are stored as yet another sub-table
                awards.append(
                    schema.MemberAward(
                        membership_number=membership_number,
                        type=award_props[0][1].text_content(),
                        location=award_props[1][1].text_content() or None,
                        date=parse(award_props[2][1].text_content() or ""),  # type: ignore[arg-type]
                    )
                )
        return awards

    @cache_hooks.cache_result(key=("disclosures", 1))
    def get_disclosures_tab(self, membership_number: int, /) -> list[schema.MemberDisclosure]:
        """Returns data from Disclosures tab for a given member.

        Args:
            membership_number: Membership Number to use

        Returns:
            A MemberDisclosure object with corresponding data from the
            disclosures tab (keys will always be present):

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

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        response = self._get_member_profile_tab(membership_number, "Disclosures")
        tree = html.fromstring(response)
        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=AccessCN":
            raise errors.CompassPermissionError(f"You do not have permission to the details of {membership_number}")

        disclosures = []
        rows = tree.xpath("//tbody/tr")
        with validation_errors_logging(membership_number):
            for row in rows:
                # Get children (cells in row)
                cells = list(row)

                disclosures.append(
                    schema.MemberDisclosure(
                        membership_number=membership_number,
                        country=cells[0].text_content() or None,  # Country sometimes missing (Application Withdrawn)
                        provider=cells[1].text_content(),
                        type=cells[2].text_content(),
                        number=cells[3].text_content() or None,  # If Application Withdrawn, no disclosure number
                        issuer=cells[4].text_content() or None,
                        issue_date=parse(cells[5].text_content()),  # If Application Withdrawn, maybe no issue date
                        status=cells[6].text_content(),
                        expiry_date=parse(cells[7].text_content()),  # If Application Withdrawn, no expiry date
                    )
                )
        return disclosures

    # See getAppointment in PGS\Needle
    @cache_hooks.cache_result(key=("role_detail", 1))
    def get_roles_detail(self, role_number: int, /) -> schema.MemberRolePopup:
        """Returns detailed data from a given role number.

        Args:
            role_number: Role Number to use

        Returns:
            A MemberRolePopup model with the data from the role detail popup
            (keys will always be present):

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

        Raises:
            requests.exceptions.RequestException:
                For errors while executing the HTTP call

        """
        response = self.s.get(f"{Settings.base_url}/Popups/Profile/AssignNewRole.aspx?VIEW={role_number}")
        tree = html.fromstring(response.content)
        if tree.forms[0].action == "./ScoutsPortal.aspx?Invalid=Access":
            raise errors.CompassPermissionError(f"You do not have permission to the details of role {role_number}")

        inputs: dict[str, Union[html.InputElement, html.SelectElement]] = dict(tree.forms[0].inputs)
        fields: dict[str, Union[str]] = {k: v.value for k, v in inputs.items() if v.value is not None}

        line_manager_number, line_manager_name = _extract_line_manager(inputs["ctl00$workarea$cbo_p2_linemaneger"])
        ce_check = fields.get("ctl00$workarea$txt_p2_cecheck", "")  # CE (Confidential Enquiry) Check
        disclosure_check, disclosure_date = _extract_disclosure_date(fields.get("ctl00$workarea$txt_p2_disclosure", ""))

        approval_values = {row[1][0].get("data-app_code"): row[1][0].get("data-db") for row in tree.xpath("//tr[@class='trProp']")}
        # row[1][0].get("title") gives title text, but this is not useful as it does not reflect latest changes,
        # but only who added the role to Compass.

        role_details: dict[str, Union[None, int, str, datetime.date]] = dict(
            role_number=role_number,
            # `organisation_level` is ignored, no corresponding field in MemberTrainingRole:
            organisation_level=fields.get("ctl00$workarea$cbo_p1_level"),
            birth_date=parse(inputs["ctl00$workarea$txt_p1_membername"].get("data-dob")),
            membership_number=int(fields.get("ctl00$workarea$txt_p1_memberno", 0)),
            # `name` is ignored, no corresponding field in MemberTrainingRole:
            name=fields.get("ctl00$workarea$txt_p1_membername", " ").split(" ", 1)[1],
            role_title=fields.get("ctl00$workarea$txt_p1_alt_title"),
            role_start=parse(fields.get("ctl00$workarea$txt_p1_startdate", "")),
            role_status=fields.get("ctl00$workarea$txt_p2_status"),
            line_manager_number=line_manager_number,
            line_manager=line_manager_name,
            review_date=parse(fields.get("ctl00$workarea$txt_p2_review", "")),
            ce_check=parse(ce_check) if ce_check != "Pending" else None,  # TODO if CE check date != current date then is valid
            disclosure_check=disclosure_check,
            disclosure_date=disclosure_date,
            references=references_codes.get(fields.get("ctl00$workarea$cbo_p2_referee_status", "")),
            appointment_panel_approval=approval_values.get("ROLPRP|AACA"),
            commissioner_approval=approval_values.get("ROLPRP|CAPR"),
            committee_approval=approval_values.get("ROLPRP|CCA"),
        )

        logger.debug(f"Processed details for role number: {role_number}.")
        # TODO data-ng_id?, data-rtrn_id?

        full_details = {
            "hierarchy": dict(_process_hierarchy(inputs)),
            "details": {k: v for k, v in role_details.items() if v is not None},  # Filter null values
            "getting_started": _process_getting_started(tree.xpath("//tr[@class='trTrain trTrainData']")),
        }

        with validation_errors_logging(role_number, name="Role Number"):
            return schema.MemberRolePopup.parse_obj(full_details)


class _AddressData(TypedDict):
    unparsed_address: Optional[str]
    country: Optional[str]
    postcode: Optional[str]
    county: Optional[str]
    town: Optional[str]
    street: Optional[str]


def _process_address(address: str) -> _AddressData:
    if address:
        addr_main, addr_code = address.rsplit(". ", 1)
        postcode, country = addr_code.rsplit(" ", 1)  # Split Postcode & Country
        try:
            street, town, county = addr_main.rsplit(", ", 2)  # Split address lines
            return dict(unparsed_address=address, country=country, postcode=postcode, county=county, town=town, street=street)
        except ValueError:
            street, town = addr_main.rsplit(", ", 1)
            return dict(unparsed_address=address, country=country, postcode=postcode, county=None, town=town, street=street)
    return dict(unparsed_address=None, country=None, postcode=None, county=None, town=None, street=None)


def _extract_primary_role(role_title: str, primary_role: Union[int, None]) -> tuple[str, Union[int, Literal[True], None]]:
    if primary_role is not None:
        return role_title, primary_role
    if role_title.endswith(" [Primary]"):
        return role_title.removesuffix(" [Primary]"), True
    return role_title, primary_role


def _extract_review_date(review_status: str) -> tuple[schema.TYPES_ROLE_STATUS, Optional[datetime.date]]:
    if review_status.startswith("Full Review Due ") or review_status.startswith("Full Ending "):
        role_status: Literal["Full"] = "Full"
        review_date = parse(review_status.removeprefix("Full Review Due ").removeprefix("Full Ending "))
        return role_status, review_date
    if review_status in ROLE_STATUSES:
        return review_status, None  # type: ignore[return-value]  # str -> Literal type narrowing doesn't seem to work?
    raise ValueError(f"Invalid value for review status '{review_status}'!")


def _reduce_date_list(dl: Iterable[tuple[datetime.date, datetime.date]]) -> Iterator[tuple[datetime.date, datetime.date]]:
    """Reduce list of start and end dates to disjoint ranges.

    Iterate through date pairs and get longest consecutive date ranges. For
    disjoint ranges, call function recursively. Returns all found date pairs.

    Args:
        dl: list of start, end date pairs

    Returns:
        list of start, end date pairs

    """
    unused_values = set()  # We init the date values with the first
    sdl = sorted(dl)
    start_, end_ = sdl[0]
    for i, (start, end) in enumerate(sdl):
        # If date range completely outwith, set both start and end
        if start < start_ and end > end_:
            start_, end_ = start, end
        # If start and latest end overlap, and end is later than latest end, update latest end
        elif start <= end_ < end:
            end_ = end
        # If end and earliest start overlap, and start is earlier than earliest start, update earliest start
        elif end >= start_ > start:
            start_ = start
        # If date range completely within, do nothing
        elif start >= start_ and end <= end_:
            pass
        # If adjacent
        elif abs(end_ - start).days == 1 or abs(start_ - end).days == 1:
            end_ = max(end, end_)
            start_ = min(start, start_)
        # If none of these (date forms a disjoint set) note as unused
        else:
            unused_values.add(i)
    yield start_, end_
    # If there are remaining items not used, pass recursively
    if len(unused_values) != 0:
        yield from _reduce_date_list((pair for i, pair in enumerate(sdl) if i in unused_values))


def _membership_duration(dates: Iterable[tuple[datetime.date, datetime.date]]) -> float:
    """Calculate days of membership (inclusive), normalise to years."""
    if not dates:  # handle empty iterable
        return 0
    membership_duration_days = sum((end - start).days + 1 for start, end in _reduce_date_list(dates))
    return round(membership_duration_days / 365.2425, 3)  # Leap year except thrice per 400 years.


def _compile_ongoing_learning(training_plps: TYPES_TRAINING_PLPS, tree: html.HtmlElement) -> TYPES_TRAINING_OGL:
    """Compiles ongoing learning data.

    Uses PLP records for GDPR, and main OGL section for Safety, Safeguarding,
    and First Aid.

    Args:
        training_plps: Parsed PLP data.
        tree: LXML tree representing training tab

    Returns:
        A map of ogl type -> dates. Data returned here as native types (dicts),
        see schema.MemberMandatoryTraining for full model.

    """
    # Handle GDPR (Get latest GDPR date)
    training_ogl: TYPES_TRAINING_OGL = dict()
    gdpr_generator: Iterator[datetime.date] = (
        module["validated_date"]
        for plp in training_plps.values()
        for module in plp
        if module["code"] == "GDPR" and isinstance(module["validated_date"], datetime.date)
    )
    training_ogl["gdpr"] = dict(completed_date=next(reversed(sorted(gdpr_generator)), None))

    # Get main OGL - safety, safeguarding, first aid
    for ongoing_learning in tree.xpath("//tr[@data-ng_code]"):
        cell_text = {c.get("id", "<None>").split("_")[0]: c.text_content() for c in ongoing_learning}
        # TODO missing data-pk from list(cell)[0].tag == "input", and module names/codes. Are these important?
        training_ogl[mogl_modules[ongoing_learning.get("data-ng_code")]] = dict(
            completed_date=parse(cell_text.get("tdLastComplete", "")),
            renewal_date=parse(cell_text.get("tdRenewal", "")),
        )

    # Update training_ogl with missing mandatory ongoing learning types
    blank_module: TYPES_TRAINING_OGL_DATES = dict(completed_date=None, renewal_date=None)
    return {mogl_type: training_ogl.get(mogl_type, blank_module) for mogl_type in mogl_modules.values()}


def _process_personal_learning_plan(plp: html.HtmlElement) -> tuple[int, list[TYPES_TRAINING_MODULE]]:
    """Parses a personal learning plan from a LXML row element containing data."""
    plp_data = []
    plp_table = plp.getchildren()[0].getchildren()[0]
    for module_row in plp_table:
        if module_row.get("class") != "msTR trMTMN":
            continue

        module_data: TYPES_TRAINING_MODULE = {}
        child_nodes = list(module_row)
        module_data["pk"] = int(module_row.get("data-pk"))
        module_data["module_id"] = int(child_nodes[0].get("id")[4:])
        matches = re.match(r"^([A-Z0-9]+) - (.+)$", child_nodes[0].text_content()).groups()  # type: ignore[union-attr]
        if matches:
            module_data["code"] = str(matches[0])
            module_data["name"] = matches[1]

        learning_required = child_nodes[1].text_content().lower()
        module_data["learning_required"] = "yes" in learning_required if learning_required else None
        module_data["learning_method"] = child_nodes[2].text_content() or None
        module_data["learning_completed"] = parse(child_nodes[3].text_content())
        module_data["learning_date"] = parse(child_nodes[3].text_content())

        validated_by_string = child_nodes[4].text_content()
        if validated_by_string:
            # Add empty item to prevent IndexError
            validated_by_data = validated_by_string.split(" ", 1) + [""]
            module_data["validated_membership_number"] = maybe_int(validated_by_data[0])
            module_data["validated_name"] = validated_by_data[1]
        module_data["validated_date"] = parse(child_nodes[5].text_content())

        plp_data.append(module_data)

    return int(plp_table.get("data-pk")), plp_data


def _process_role_data(role: html.HtmlElement) -> tuple[int, dict[str, Union[None, str, int, datetime.date]]]:
    """Parses a personal learning plan from a LXML row element containing data."""
    child_nodes = list(role)

    role_data: dict[str, Union[None, str, int, datetime.date]] = dict()
    role_number = int(role.get("data-ng_mrn"))
    role_data["role_number"] = role_number
    role_data["role_title"] = child_nodes[0].text_content()
    role_data["role_start"] = parse(child_nodes[1].text_content())
    status_with_review = child_nodes[2].text_content()
    # TODO for `Ending: blah` roles, should we store the ending date?
    if status_with_review.startswith("Full (Review Due: ") or status_with_review.startswith("Full (Ending: "):
        role_data["role_status"] = "Full"
        date_str = status_with_review.removeprefix("Full (Review Due: ").removeprefix("Full (Ending: ").rstrip(")")
        role_data["review_date"] = parse(date_str)
    else:
        role_data["role_status"] = status_with_review
        role_data["review_date"] = None
    role_data["location"] = child_nodes[3].text_content()
    training_advisor_string = child_nodes[4].text_content()
    if training_advisor_string:
        role_data["ta_data"] = training_advisor_string
        # Add empty item to prevent IndexError
        training_advisor_data = training_advisor_string.split(" ", 1) + [""]
        role_data["ta_number"] = maybe_int(training_advisor_data[0])
        role_data["ta_name"] = training_advisor_data[1]
    completion_string = child_nodes[5].text_content()
    if completion_string:
        role_data["completion"] = completion_string
        parts = completion_string.split(":")
        role_data["completion_type"] = parts[0].strip()
        role_data["completion_date"] = parse(parts[1].strip())
    role_data["wood_badge_number"] = child_nodes[5].get("id", "").removeprefix("WB_") or None

    return role_number, role_data


def _extract_line_manager(line_manager_list: html.SelectElement) -> tuple[Optional[int], Optional[str]]:
    line_manager_el = next((op for op in line_manager_list if op.get("selected")), None)
    if line_manager_el is None:
        return None, None
    number = maybe_int(line_manager_el.get("value"))
    name = line_manager_el.text.strip()
    if name in unset_vals:
        return number, None
    return number, name


def _extract_disclosure_date(disclosure_status: str) -> tuple[Optional[str], Optional[datetime.date]]:
    """Return tuple of disclosure check status, disclosure date."""
    if disclosure_status.startswith("Disclosure Issued : "):
        return "Disclosure Issued", parse(disclosure_status.removeprefix("Disclosure Issued : "))
    return disclosure_status or None, None


def _process_hierarchy(inputs: dict[str, html.HtmlElement]) -> Iterator[tuple[str, str]]:
    """Get all levels of the org hierarchy and select those that will have information."""
    # Get all inputs with location data
    for input_name, input_el in inputs.items():
        if "ctl00$workarea$cbo_p1_location" not in input_name:
            continue
        level_name = input_el.get("title").lower()
        level_value = input_el[0].text
        if level_value not in unset_vals:
            yield "county" if level_name == "county / area / scottish region / overseas branch" else level_name, level_value


def _process_getting_started(getting_started_modules: html.HtmlElement) -> dict[str, dict[str, Union[None, str, datetime.date]]]:
    """Process getting started modules."""
    modules_output = {}
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

    return modules_output
