from __future__ import annotations

import datetime
from typing import Literal, Optional, Union
import warnings

import phonenumbers
import pydantic

TYPES_ROLE_STATUS = Literal["Cancelled", "Closed", "Full", "Pre provisional", "Provisional"]
TYPES_SEX = Literal["Male", "Female", "Unknown"]
TYPES_ETHNICITY = Literal[
    "1.English/Welsh/Scottish/Northern Irish/British",
    "2.Irish",
    "3.Gypsy or Irish Traveller",
    "4.Any other White background",
    "5.White and Black Caribbean",
    "6.White and Black African",
    "7.White and Asian",
    "8.Any other mixed or Multiple ethic group",
    "9.Indian",
    "10.Pakistani",
    "11.Bangladeshi",
    "12.Chinese",
    "13.Any other Asian Background",
    "14.African",
    "15.Caribbean",
    "16.Any other Black/African/Caribbean background",
    "17.Arab",
    "18.Other",
    "19.Prefer not to say",
]
TYPES_RELIGION = Union[  # type: ignore[misc]
    Literal[
        "Buddhist",
        "Christian (including all Christian denominations)",
        "Hindu",
        "Jewish",
        "Muslim",
        "Any other religion (please specify)",
        "No religion",
        "Prefer not to say",
    ],
    pydantic.constr(regex=r"^Christian.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Any other religion.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^No religion.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
]
TYPES_OCCUPATION = Union[  # type: ignore[misc]
    Literal[
        "Employed",
        "Unemployed",
        "Retired (whether receiving a pension or not)",
        "Student",
        "Long term sick or disabled",
        "Looking after home of family",
        "Other",
    ],
    pydantic.constr(regex=r"^Employed.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Unemployed.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Retired.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Student.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Long term sick or disabled.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Looking after home of family.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Other.*"),  # NoQA: F722 (https://stackoverflow.com/a/64917499)
]
TYPES_ROLE_CLASS = Literal[
    "Administrator",
    "Advisor",
    "Assessor",
    "Co-ordinator",
    "Commissioner",
    "Committee",
    "Helper",
    "Honorary",
    "Leader",
    "Manager",
    "Secretary",
    "Staff",
    "System Role",
    "Supporter",
    "Trainer",
    "Default role class",
]
TYPES_REFERENCES = Literal[
    "Not Complete",
    "Not Required",
    "References Requested",
    "References Satisfactory",
    "References Unsatisfactory",
]
TYPES_DISCLOSURES_APPOINTMENT = Literal[
    "Application submitted - in progress",
    "Disclosure Issued",
    "ID check required",
    "No Disclosure",
]  # Disclosure statuses in role details popup
TYPES_LEARNING_METHOD = Literal[
    "Course",
    "DVD/Video",
    "E-Learning",
    "External Course",
    "Independent Study",
    "On the Job",
    "One to One",
    "Practical",
    "Small Group",
    "Workbook",
    "Your prior learning/experience recognised",
    "Other",
    # First Aid
    "Life Support",
    "Major illness",
    "Trauma and injury",
    # Manager and Supporter: Induction (rare)
    "RST Induction [England only]",
    # Manager and Supporter: Skills Courses
    "Skills Course - Achieving Growth",
    "Skills Course - Meeting the Challenges",
    "Skills Course - Skills of Management",
    # Manager and Supporter: Independent Learning
    "IL - Building Effective Teams",
    "IL - Dealing with Difficult Situations",
    "IL - Decision Making",
    "IL - Enabling Change",
    "IL - Financial and Physical Resources",
    "IL - Finding, Appointing and Welcoming Volunteers",
    "IL - Getting the Word Out",
    "IL - Keeping, Developing and Managing Volunteers",
    "IL - Leading Local Scouting",
    "IL - Managing Time and Personal Skills",
    "IL - Planning For Growth",
    "IL - Project Management",
    "IL - Safety for Managers and Supporters",
    "IL - Supporting the Adult Training Scheme",
]
TYPES_PERMIT = Literal[
    "Archery",
    "Bell Boating",
    "Canoeing",
    "Caving",
    "Climbing and Abseiling",
    "Dinghy Sailing",
    "Dragon Boating",
    "Hill Walking",
    "Hovercrafting",
    "Ice Climbing",
    "Kayaking",
    "Keelboating",
    "Kite Surfing",
    "Mine Exploration",
    "Motor Cruising",
    "Mountain Biking",
    "Narrow Boating",
    "Nights Away",
    "Personal Watercraft (Jet Ski)",
    "Power Boating",
    "Pulling",
    "Rafting (Traditional)",
    "Rowing and Sculling",
    "Scuba Diving",
    "Snorkelling",
    "Snowsports",
    "Water Skiing",
    "White Water Rafting",
    "Windsurfing",
    "Yachting",
]
TYPES_PERMIT_CATEGORIES = Literal[
    "B1 Waters",
    "B2 Waters",
    "B2+ Waters",
    "B3 Waters",
    "C Waters",
    "Campsite",
    "Greenfield",
    "Indoor",
    "Lightweight Expedition",
    "Open Inland B1 Waters",
    "Open Inland B2 Waters",
    "Open Inland B3 Waters",
    "River B1 Waters",
    "Sea B1 Waters",
    "Sea B2 Waters",
    "Surf B2 Waters",
    "With Compound Bows",
    "Without Compound Bows",
]
TYPES_PERMIT_TYPE = Literal["Leadership", "Supervisory"]
TYPES_AWARD_TYPE = Literal[
    "Chief Scout's 5 years Service Award",
    "Chief Scout's 10 years Service Award",
    "Chief Scout's 15 years Service Award",
    "Chief Scout's 20 years Service Award",
    "Chief Scout's 25 years Service Award",
    "Chief Scout's 30 years Service Award",
    "Chief Scout's 40 years Service Award",
    "Chief Scout's 50 years Service Award",
    "Chief Scout's 60 years Service Award",
    "Chief Scout's 70 years Service Award",
    # Local / less formal awards
    "Commissioners Commendation",
    # Formal awards process - lower good service
    "Chief Scout's Commendation for Good Service",
    "Award for Merit",
    "Bar to the Award for Merit",
    "Silver Acorn",
    # Formal awards process - higher good service
    "Bar to the Silver Acorn",
    "Silver Wolf",
    # ???
    "Medal of Merit",
    "Bar to the Medal of Merit",
]
TYPES_DISCLOSURE_PROVIDERS = Literal[
    "Access NI",
    "Atlantic Data",
    "DBS Paper Application",
    "Disclosure Scotland",
    "Local Check",  # BSO
    "Other",
]
TYPES_DISCLOSURE_STATUSES = Literal[
    "Application Withdrawn",
    "Application received at HQ",
    "Application submitted - in progress",
    "Disclosure Expired",
    "Disclosure Issued",
    "Expired",
    "Final applicant information required",  # BSO
    "ID check required",
    "ID selection required",
]  # Disclosure statuses in disclosures tab


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
    religion: Optional[TYPES_RELIGION] = None  # type: ignore[valid-type]
    occupation: Optional[TYPES_OCCUPATION] = None  # type: ignore[valid-type]
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
            return None

        try:
            n = phonenumbers.parse(v, "GB")
        except phonenumbers.NumberParseException as err:
            membership_number = values["membership_number"]
            raise ValueError(f"Member No {membership_number}: phone number {v} is not valid!") from err  # must be a ValueError

        if not phonenumbers.is_valid_number(n):
            membership_number = values["membership_number"]
            warnings.warn(f"Member No {membership_number}: phone number {v} is not valid!", RuntimeWarning)

        fmt = phonenumbers.PhoneNumberFormat.NATIONAL if n.country_code == 44 else phonenumbers.PhoneNumberFormat.INTERNATIONAL
        return str(phonenumbers.format_number(n, fmt))


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
    primary_role: Union[int, None]  # Primary role number. None if no primary role found


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
    number: Union[Optional[int], pydantic.constr(regex=r"^\d{7}R$")]  # type: ignore[valid-type]  # NoQA: F722
    issuer: Optional[TYPES_DISCLOSURE_PROVIDERS]
    issue_date: Optional[datetime.date]  # If Application Withdrawn, maybe no issue date
    status: TYPES_DISCLOSURE_STATUSES
    expiry_date: Optional[datetime.date]  # If Application Withdrawn, no expiry date
