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
    forenames: str = None
    surname: str = None

    birth_date: opt_date = None
    sex: TYPES_SEX = None
    nationality: opt_str = None
    ethnicity: opt_str = None
    religion: opt_str = None

    join_date: opt_date = None
    occupation: opt_str = None

    address: opt_str = None
    main_phone: opt_int = None
    main_email: opt_str = None  # EmailStr?

    # class Config:
    #     orm_mode = True


class MemberRole(MemberBase):
    role_name: str

    # Role details
    role_start: str
    role_end: str
    role_status: str

    # Manager information
    line_manager_number: int
    line_manager: str
    review_date: str

    # Role location
    organisation: str
    country: str
    region: str
    county: str
    district: str
    scout_group: str
    section: str

    # Approval information
    ce_check: str
    appointment_panel_approval: str
    commissioner_approval: str
    committee_approval: str
    references: str

    # Training
    module_01: str
    module_02: str
    module_03: str
    module_04: str
    gdpr: str
    training_completion_date: str


class MemberPermit(MemberBase):
    permit_type: TYPES_PERMIT
    category: str
    type: str
    restrictions: str
    expires: datetime.date
    status: bool
