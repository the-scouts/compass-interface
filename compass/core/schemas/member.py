from __future__ import annotations

import datetime
from typing import Literal, Optional, Union
import warnings

import phonenumbers
import pydantic

from compass.core.types.member import TYPES_AWARD_TYPE
from compass.core.types.member import TYPES_DISCLOSURE_PROVIDERS
from compass.core.types.member import TYPES_DISCLOSURE_STATUSES
from compass.core.types.member import TYPES_DISCLOSURES_APPOINTMENT
from compass.core.types.member import TYPES_ETHNICITY
from compass.core.types.member import TYPES_LEARNING_METHOD
from compass.core.types.member import TYPES_OCCUPATION
from compass.core.types.member import TYPES_PERMIT
from compass.core.types.member import TYPES_PERMIT_TYPE
from compass.core.types.member import TYPES_REFERENCES
from compass.core.types.member import TYPES_RELIGION
from compass.core.types.member import TYPES_ROLE_CLASS
from compass.core.types.member import TYPES_ROLE_STATUS
from compass.core.types.member import TYPES_SEX


class MemberBase(pydantic.BaseModel):
    membership_number: int


class MemberRoleBase(pydantic.BaseModel):
    # Role details
    role_number: int
    role_title: str  # role_name
    role_start: datetime.date
    role_status: TYPES_ROLE_STATUS
    review_date: Optional[datetime.date] = None


class MemberDetailsAddress(pydantic.BaseModel):
    unparsed_address: Optional[str] = None  # this is the unmodified address string
    country: Optional[str] = None
    postcode: Optional[str] = None
    county: Optional[str] = None
    town: Optional[str] = None
    street: Optional[str] = None


# Personal Details Tab
class MemberDetails(MemberBase):
    # Name
    name: str
    known_as: str
    forenames: Optional[str] = None
    surname: Optional[str] = None

    # Core personal information
    birth_date: Optional[datetime.date] = None
    sex: Optional[TYPES_SEX] = None
    nationality: Optional[str] = None  # literal? Big list...!
    ethnicity: Optional[TYPES_ETHNICITY] = None
    religion: Optional[TYPES_RELIGION] = None
    religion_detail: Optional[str] = None
    occupation: Optional[TYPES_OCCUPATION] = None
    occupation_detail: Optional[str] = None
    join_date: Optional[datetime.date] = None

    # Contact Details
    main_phone: Optional[str] = None
    main_email: Optional[pydantic.EmailStr] = None
    address: MemberDetailsAddress = MemberDetailsAddress()

    # Additional / miscellaneous details (maybe add keyed models ref #86)
    disabilities: Optional[dict[str, str]] = None
    qualifications: Optional[dict[str, str]] = None
    hobbies: Optional[dict[str, str]] = None

    # pylint doesn't support custom decorators. https://github.com/PyCQA/pylint/issues/1694
    # pylint: disable=no-self-use
    @pydantic.validator("main_phone")
    def check_phone_number(cls, v: Optional[str], values: dict[str, object]) -> Optional[str]:
        if v is None or not v or v == "0" or len(v) < 2:
            return None  # checks for v in (None, "", "0", .{1,2})

        try:
            n = phonenumbers.parse(v, "GB")
            if phonenumbers.is_valid_number(n):
                if n.country_code == 44:
                    return f"{phonenumbers.format_number(n, phonenumbers.PhoneNumberFormat.NATIONAL)}"
                return f"{phonenumbers.format_number(n, phonenumbers.PhoneNumberFormat.INTERNATIONAL)}"
        except phonenumbers.NumberParseException:
            pass

        membership_number = values["membership_number"]
        warnings.warn(f"Member No {membership_number}: phone number {v} is not valid!", RuntimeWarning)
        return None  # mypy being silly


# Roles Tab (Main List - item)
class MemberRoleCore(MemberBase, MemberRoleBase):
    # Role details
    role_end: Optional[datetime.date] = None
    role_class: TYPES_ROLE_CLASS
    role_type: Optional[str] = None
    # Full list of role types runs to 458, probably too many for a Literal type
    # xref: https://compass.scouts.org.uk/Roles.aspx?closed=Y

    # Location details
    location_id: Optional[int] = None
    location_name: Optional[str] = None

    # Is the role details popup accessible?
    can_view_details: bool


# Roles Tab (Main List - collection)
class MemberRolesCollection(pydantic.BaseModel):
    roles: dict[int, MemberRoleCore]
    membership_duration: float  # Membership duration in qualifying roles, in years
    primary_role: Optional[int]  # Primary role number. None if no primary role found


# Roles Tab (Role Detail Popup - Main)
class MemberRoleDetail(MemberBase, MemberRoleBase):
    organisation_level: str
    birth_date: Optional[datetime.date]
    name: str

    # Approval Process
    line_manager_number: Optional[int] = None
    line_manager: Optional[str] = None

    # Approval information
    ce_check: Optional[datetime.date]  # Optional for Closed roles - e.g. #499, role closed 1976, or if Pending
    disclosure_check: Optional[TYPES_DISCLOSURES_APPOINTMENT]
    disclosure_date: Optional[datetime.date]
    references: Optional[TYPES_REFERENCES] = None
    appointment_panel_approval: Optional[Literal["NC", "NR", "S", "U"]] = None
    commissioner_approval: Optional[Literal["NC", "NR", "RR", "S", "U"]] = None
    committee_approval: Optional[Literal["NC", "S", "U"]] = None


# Roles Tab (Role Detail Popup - Hierarchy)
class MemberRoleHierarchy(pydantic.BaseModel):
    # Role location
    organisation: str
    country: Optional[str] = None
    region: Optional[str] = None
    county: Optional[str] = None
    district: Optional[str] = None
    group: Optional[str] = None
    section: Optional[str] = None


# Roles Tab (Role Detail Popup - Getting Started)
class MemberRoleGettingStartedModule(pydantic.BaseModel):
    validated: Optional[datetime.date] = None
    validated_by: Optional[str] = None


# Roles Tab (Role Detail Popup - Getting Started)
class MemberRoleGettingStarted(pydantic.BaseModel):
    """Getting Started Training."""

    module_01: Optional[MemberRoleGettingStartedModule] = None
    trustee_intro: Optional[MemberRoleGettingStartedModule] = None
    module_02: Optional[MemberRoleGettingStartedModule] = None
    module_03: Optional[MemberRoleGettingStartedModule] = None
    module_04: Optional[MemberRoleGettingStartedModule] = None
    gdpr: Optional[MemberRoleGettingStartedModule] = None
    safety: Optional[MemberRoleGettingStartedModule]
    safeguarding: Optional[MemberRoleGettingStartedModule]


# Roles Tab (Role Detail Popup - All)
class MemberRolePopup(pydantic.BaseModel):
    hierarchy: MemberRoleHierarchy
    details: MemberRoleDetail
    getting_started: MemberRoleGettingStarted


# Training Tab (Role)
class MemberTrainingRole(MemberRoleBase):
    # Location details
    location: Optional[str] = None

    # Training Advisor details
    ta_data: Optional[str]
    ta_number: Optional[int]
    ta_name: Optional[str]

    # Completion details
    completion: Optional[str]
    completion_type: Optional[Literal["PLP", "Wood Badge"]]
    completion_date: Optional[datetime.date]
    wood_badge_number: Optional[int]


# Training Tab (PLP)
class MemberTrainingPLP(pydantic.BaseModel):
    pk: int
    module_id: int
    code: str  # We could do literals for module name/code but this would be ~150 values
    name: str

    # Learning details
    learning_required: Optional[bool]
    learning_method: Optional[TYPES_LEARNING_METHOD]
    learning_completed: Optional[datetime.date]
    learning_date: Optional[datetime.date]

    # Validation details
    validated_membership_number: Optional[int]
    validated_name: Optional[str]
    validated_date: Optional[datetime.date]


# Training Tab (OGL - item)
class MemberMOGL(pydantic.BaseModel):
    completed_date: Optional[datetime.date]
    renewal_date: Optional[datetime.date]  # GDPR has no renewal date...??


# Training Tab (OGL - all)
class MemberMandatoryTraining(pydantic.BaseModel):
    safety: MemberMOGL
    safeguarding: MemberMOGL
    first_aid: MemberMOGL
    gdpr: MemberMOGL


# Training Tab
class MemberTrainingTab(pydantic.BaseModel):
    roles: dict[int, MemberTrainingRole]
    plps: dict[int, list[MemberTrainingPLP]]
    mandatory: MemberMandatoryTraining


# Permits Tab
class MemberPermit(MemberBase):
    permit_type: TYPES_PERMIT
    category: str
    type: TYPES_PERMIT_TYPE
    restrictions: str
    expires: Optional[datetime.date]
    status: Literal["PERM_OK", "PERM_EXP", "PERM_REV"]


class MemberAward(MemberBase):
    type: TYPES_AWARD_TYPE
    location: Optional[str]
    date: datetime.date


class MemberDisclosure(MemberBase):
    country: Optional[Literal["England & Wales", "Northern Ireland", "Overseas", "Scotland", "The Scout Association"]]
    provider: TYPES_DISCLOSURE_PROVIDERS
    type: Literal["Enhanced with Barring"]
    # If Application Withdrawn, no disclosure number. If Scottish in the early 2000s, 7 digits ending with an R
    number: Union[int, None, pydantic.constr(regex=r"^\d{7}R$")]  # type: ignore[valid-type]  # NoQA: F722
    issuer: Optional[TYPES_DISCLOSURE_PROVIDERS]
    issue_date: Optional[datetime.date]  # If Application Withdrawn, maybe no issue date
    status: TYPES_DISCLOSURE_STATUSES
    expiry_date: Optional[datetime.date]  # If Application Withdrawn, no expiry date
