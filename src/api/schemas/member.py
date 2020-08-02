import datetime
from typing import List, Optional, Literal

from pydantic import BaseModel, EmailStr

TYPES_SEX = Optional[Literal["Male", "Female"]]
TYPES_PERMIT = Optional[
    Literal[
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
]
opt_str = Optional[str]
opt_int = Optional[int]
opt_date = Optional[datetime.date]


class MemberBase(BaseModel):
    membership_number: int


class Member(MemberBase):
    name: str
    known_as: str
    forenames: opt_str = None
    surname: opt_str = None

    birth_date: opt_date = None
    sex: TYPES_SEX = None
    nationality: opt_str = None
    ethnicity: opt_str = None
    religion: opt_str = None

    join_date: opt_date = None
    occupation: opt_str = None

    postcode: opt_str = None
    main_phone: opt_str = None
    main_email: opt_str = None  # EmailStr?

    # class Config:
    #     orm_mode = True


class MemberRole(MemberBase):
    role_name: str

    # Role details
    role_start: str
    role_end: opt_str = None
    role_status: str

    # Manager information
    line_manager_number: opt_int = None
    line_manager: opt_str = None
    review_date: opt_str = None

    # Role location
    organisation: str
    country: opt_str = None
    region: opt_str = None
    county: opt_str = None
    district: opt_str = None
    group: opt_str = None
    section: opt_str = None

    # Approval information
    ce_check: opt_str = None
    appointment_panel_approval: opt_str = None
    commissioner_approval: opt_str = None
    committee_approval: opt_str = None
    references: opt_str = None

    # Training
    module_01: opt_str = None
    module_02: opt_str = None
    module_03: opt_str = None
    module_04: opt_str = None
    gdpr: opt_str = None
    training_completion_date: opt_str = None


class MemberPermit(MemberBase):
    permit_type: TYPES_PERMIT
    category: str
    type: str
    restrictions: str
    expires: datetime.date
    status: bool


class MemberOngoing(MemberBase):
    safety: datetime.date = None
    safeguarding: datetime.date = None
    first_aid: datetime.date = None
    gdpr: datetime.date = None
