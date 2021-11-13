import datetime
from typing import Generic, Literal, Optional, TypeVar, Union
import warnings

import phonenumbers
import pydantic
from pydantic import generics

# Must use typing.Dict etc for generics not native as of pydantic 1.7.3
from typing import List, Dict  # isort: skip

DataT = TypeVar("DataT")

TYPES_SEX = Literal["Male", "Female"]  # also 'Unknown'
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
TYPES_RELIGION = Union[
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
    pydantic.constr(regex=r"^Christian.*"),  # NoQA F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Any other religion.*"),  # NoQA F722 (https://stackoverflow.com/a/64917499)
]
TYPES_OCCUPATION = Union[
    Literal[
        "Employed",
        "Unemployed",
        "Retired (whether receiving a pension or not)",
        "Student",
        "Long term sick or disabled",
        "Looking after home of family",
        "Other",
    ],
    pydantic.constr(regex=r"^Employed.*"),  # NoQA F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Unemployed.*"),  # NoQA F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Retired.*"),  # NoQA F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Long term sick or disabled.*"),  # NoQA F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Looking after home of family.*"),  # NoQA F722 (https://stackoverflow.com/a/64917499)
    pydantic.constr(regex=r"^Other.*"),  # NoQA F722 (https://stackoverflow.com/a/64917499)
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


class MemberGenericDict(generics.GenericModel, Generic[DataT]):
    __root__: Dict[int, DataT]  # Must use typing.Dict not dict as of pydantic 1.7.3

    def __iter__(self):
        """Iterate over model items."""
        yield from self.__root__.items()

    def __getitem__(self, item):
        """Get item by key."""
        return self.__root__[item]

    def __len__(self):
        """Get number of items."""
        return len(self.__root__)

    def items(self):
        yield from iter(self)


class MemberGenericList(generics.GenericModel, Generic[DataT]):
    __root__: List[DataT]

    def __iter__(self):
        """Iterate over model items."""
        return iter(self.__root__)

    def __getitem__(self, item):
        """Get item by index."""
        return self.__root__[item]

    def __len__(self):
        """Get number of items."""
        return len(self.__root__)


class MemberBase(pydantic.BaseModel):
    membership_number: int


class MemberRoleBase(pydantic.BaseModel):
    # Role details
    role_number: int
    role_title: str  # role_name
    role_start: datetime.date
    role_status: Literal["Cancelled", "Closed", "Full", "Pre provisional", "Provisional"]
    review_date: Optional[datetime.date] = None


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
    occupation: Optional[TYPES_OCCUPATION] = None
    join_date: Optional[datetime.date] = None

    # Contact Details
    postcode: Optional[str] = None
    main_phone: Optional[str] = None
    main_email: Optional[pydantic.EmailStr] = None
    # TODO address

    # Additional / miscellaneous details
    # TODO - potential disabilities, qualifications, hobbies sections

    @pydantic.validator("main_phone")
    def check_phone_number(cls, v, values):
        if v is None or not v or v == "0":
            return None

        try:
            n = phonenumbers.parse(v, "GB")
        except phonenumbers.NumberParseException as e:
            cn = values["membership_number"]
            raise ValueError(f"Member No {cn}: phone number {v} is not valid!") from e

        if not phonenumbers.is_valid_number(n):
            cn = values["membership_number"]
            warnings.warn(f"Member No {cn}: phone number {v} is not valid!", RuntimeWarning)

        fmt = phonenumbers.PhoneNumberFormat.NATIONAL if n.country_code == 44 else phonenumbers.PhoneNumberFormat.INTERNATIONAL
        return phonenumbers.format_number(n, fmt)


# Roles Tab (Main List - item)
class MemberRoleCore(MemberBase, MemberRoleBase):
    # Role details
    role_end: Optional[datetime.date] = None
    role_class: TYPES_ROLE_CLASS
    role_type: Optional[str] = None  # TODO literal

    # Location details
    location_id: Optional[int] = None
    location_name: Optional[str] = None

    # Is the role details popup accessible?
    can_view_details: bool


# Roles Tab (Main List - collection)
MemberRolesDict = MemberGenericDict[MemberRoleCore]


# Roles Tab (Role Detail Popup - Main)
class MemberRoleDetail(MemberBase, MemberRoleBase):
    organisation_level: str
    birth_date: datetime.date
    name: str

    # Approval Process
    line_manager_number: Optional[int] = None
    line_manager: Optional[str] = None

    # Approval information
    ce_check: datetime.date
    disclosure_check: Literal["Disclosure Issued"]
    disclosure_date: Optional[datetime.date]
    references: Optional[TYPES_REFERENCES] = None
    appointment_panel_approval: Optional[Literal["S", "NC", "NR", "U"]] = None
    commissioner_approval: Optional[Literal["S", "NR", "RR", "U"]] = None
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
    # name: str  # Module name  # needed?? as saved under key
    validated: Optional[datetime.date] = None
    validated_by: Optional[str] = None


# Roles Tab (Role Detail Popup - Getting Started)
class MemberRoleGettingStarted(pydantic.BaseModel):
    # Getting Started Training
    module_01: Optional[MemberRoleGettingStartedModule] = None
    trustee_intro: Optional[MemberRoleGettingStartedModule] = None
    module_02: Optional[MemberRoleGettingStartedModule] = None
    module_03: Optional[MemberRoleGettingStartedModule] = None
    module_04: Optional[MemberRoleGettingStartedModule] = None
    gdpr: Optional[MemberRoleGettingStartedModule] = None
    # training_completion_date: Optional[str] = None  # TODO where is this from???!!!


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
    completion_type: Optional[str]
    completion_date: Optional[datetime.date]
    wood_badge_number: Optional[int]  # WB_1234567


# Training Tab (PLP)
class MemberTrainingPLP(pydantic.BaseModel):
    pk: int
    module_id: int
    code: str  # TODO literal
    name: str  # TODO literal

    # Learning details
    learning_required: Optional[bool]
    learning_method: Optional[str]
    learning_completed: Optional[datetime.date]
    learning_date: Optional[datetime.date]

    # Validation details
    validated_membership_number: Optional[int]
    validated_name: Optional[str]
    validated_date: Optional[datetime.date]


# Training Tab (OGL - item)
class MemberMOGL(pydantic.BaseModel):
    name: Literal["GDPR", "Safeguarding", "Safety", "First Aid"]
    completed_date: Optional[datetime.date]
    renewal_date: Optional[datetime.date]  # GDPR has no renewal date...??


# Training Tab (OGL - all)
class MemberMOGLList(pydantic.BaseModel):
    SA: Optional[MemberMOGL]
    SG: Optional[MemberMOGL]
    FA: Optional[MemberMOGL]
    GDPR: Optional[MemberMOGL]


# Training Tab
class MemberTrainingTab(pydantic.BaseModel):
    roles: dict[int, MemberTrainingRole]
    plps: dict[int, list[MemberTrainingPLP]]
    mandatory: MemberMOGLList


# Permits Tab
class MemberPermit(MemberBase):
    permit_type: TYPES_PERMIT
    category: str
    type: TYPES_PERMIT_TYPE
    restrictions: str
    expires: Optional[datetime.date]
    status: Literal["PERM_OK", "PERM_EXP", "PERM_REV"]


# Permits Tab - collection
MemberPermitsList = MemberGenericList[MemberPermit]
