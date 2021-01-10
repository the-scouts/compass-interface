import datetime
from typing import Optional, Literal, Generic, TypeVar
from typing import List, Dict  # Must use typing.Dict etc not native as of pydantic 1.7.3

from pydantic import generics
import pydantic

DataT = TypeVar('DataT')

TYPES_SEX = Literal["Male", "Female"]
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
    'B1 Waters',
    'B2 Waters',
    'B2+ Waters',
    'B3 Waters',
    'C Waters',
    'Campsite',
    'Greenfield',
    'Indoor',
    'Lightweight Expedition',
    'Open Inland B1 Waters',
    'Open Inland B2 Waters',
    'Open Inland B3 Waters',
    'River B1 Waters',
    'Sea B1 Waters',
    'Sea B2 Waters',
    'Surf B2 Waters',
    'With Compound Bows',
    'Without Compound Bows'
]
TYPES_PERMIT_TYPE = Literal['Leadership', 'Supervisory']


class MemberGenericDict(generics.GenericModel, Generic[DataT]):
    __root__: Dict[int, DataT]  # Must use typing.Dict not dict as of pydantic 1.7.3

    def __iter__(self):
        return iter(self.__root__)

    def __getitem__(self, item):
        return self.__root__[item]

    def __len__(self):
        return len(self.__root__)

    def items(self):
        for i in self.__root__:
            yield i, self[i]


class MemberGenericList(generics.GenericModel, Generic[DataT]):
    __root__: List[DataT]

    def __iter__(self):
        return iter(self.__root__)

    def __getitem__(self, item):
        return self.__root__[item]

    def __len__(self):
        return len(self.__root__)


class MemberBase(pydantic.BaseModel):
    membership_number: int


class MemberRoleBase(pydantic.BaseModel):
    # Role details
    role_number: int
    role_title: str  # role_name
    role_start: datetime.date
    role_status: str


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
    nationality: Optional[str] = None  # TODO literal
    ethnicity: Optional[str] = None  # TODO literal
    religion: Optional[str] = None  # TODO literal
    occupation: Optional[str] = None
    join_date: Optional[datetime.date] = None

    # Contact Details
    postcode: Optional[str] = None
    main_phone: Optional[str] = None
    main_email: Optional[pydantic.EmailStr] = None
    # TODO address

    # Additional / miscellaneous details
    # TODO - potential disabilities, qualifications, hobbies sections


# Roles Tab (Main List - item)
class MemberRoleCore(MemberBase, MemberRoleBase):
    # Role details
    role_end: Optional[datetime.date] = None
    role_class: str
    role_type: Optional[str] = None

    # Location details
    location_id: Optional[int] = None
    location_name: Optional[str] = None


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
    review_date: Optional[str] = None

    # Approval information
    ce_check: Optional[str] = None
    disclosure_check: str
    references: Optional[str] = None
    appointment_panel_approval: Optional[str] = None
    commissioner_approval: Optional[str] = None
    committee_approval: Optional[str] = None


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


# TODO Roles Tab (Role Detail Popup - Getting Started)
# class MemberRoleGettingStarted(pydantic.BaseModel):
#     # Training
#     module_01: Optional[str] = None
#     module_02: Optional[str] = None
#     module_03: Optional[str] = None
#     module_04: Optional[str] = None
#     gdpr: Optional[str] = None
#     training_completion_date: Optional[str] = None


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
    wood_badge_number: Optional[str]


# Training Tab (Role) - collections
MemberTrainingRolesDict = MemberGenericDict[MemberTrainingRole]


# Training Tab (PLP)
class MemberTrainingPLP(pydantic.BaseModel):
    pk: int
    module_id: int
    code: str
    name: str

    # Learning details
    learning_required: Optional[bool]
    learning_method: Optional[str]
    learning_completed: Optional[datetime.date]
    learning_date: Optional[datetime.date]

    # Validation details
    validated_membership_number: Optional[int]
    validated_name: Optional[str]
    validated_date: Optional[datetime.date]


# Training Tab (PLP) - collections
MemberTrainingPLPsList = MemberGenericList[MemberTrainingPLP]
MemberTrainingPLPsListsDict = MemberGenericDict[MemberTrainingPLPsList]


# Training Tab (OGL - item)
class MemberMOGL(pydantic.BaseModel):
    name: str
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
    roles: MemberTrainingRolesDict
    plps: MemberTrainingPLPsListsDict
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
