from __future__ import annotations

from typing import Literal, Optional

import pydantic

TYPES_SECTION = Literal[
    "EY Pilot",
    "Beavers",
    "Cubs",
    "Scouts",
    "Explorers",
    "Network",
    "ASU",
    "Other",
]
TYPES_UNIT_LEVELS = Literal["Group", "District", "County", "Region", "Country", "Organisation"]


class HierarchyBase(pydantic.BaseModel):
    unit_id: int


class HierarchyUnit(HierarchyBase):
    name: str


class HierarchySection(HierarchyUnit):
    # section details (only if a section!)
    section_type: Optional[TYPES_SECTION]


class HierarchyLevel(HierarchyBase):
    level: TYPES_UNIT_LEVELS


class UnitData(HierarchyLevel):
    child: Optional[list[DescendantData]]  # NOTE: deliberate recursive/forward reference here!
    sections: list[HierarchySection]


class DescendantData(UnitData, HierarchyUnit):
    pass


UnitData.update_forward_refs()  # NOTE: updating recursive/forward reference here!
DescendantData.update_forward_refs()  # NOTE: updating recursive/forward reference here!


class HierarchyMemberID(pydantic.BaseModel):
    contact_number: int


class HierarchyMember(HierarchyMemberID):
    name: Optional[str]
    role: Optional[str]


class HierarchyUnitMembers(HierarchyBase):
    members: list[HierarchyMember]
