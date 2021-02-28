from __future__ import annotations

from typing import Literal, Optional

import pydantic

TYPES_SECTION = Literal[
    "Early Years Pilot",
    "Beavers",
    "Beaver Scout",
    "Cub Scout",
    "Explorer Scouts",
    "Scout",
    "Scout Active Support",
    "Scout Network",
    "Other",
]
TYPES_UNIT_LEVELS = Literal["Group", "District", "County", "Region", "Country", "Organisation"]


class HierarchyBase(pydantic.BaseModel):
    id: int


class HierarchyUnit(HierarchyBase):
    name: str
    parent_id: int

    # metadata
    status: Literal["ACT"]
    address: str
    member_count: int


class HierarchySection(HierarchyUnit):
    # section details (only if a section!)
    section_type: Optional[TYPES_SECTION]


class HierarchyLevel(HierarchyBase):
    level: TYPES_UNIT_LEVELS


class UnitData(HierarchyLevel):
    child: Optional[list[DescendantData]]  # NOTE: deliberate recursive/forward reference here!
    sections: list[HierarchySection]


class DescendantData(HierarchyUnit, UnitData):
    pass


UnitData.update_forward_refs()  # NOTE: updating recursive/forward reference here!
DescendantData.update_forward_refs()  # NOTE: updating recursive/forward reference here!


class HierarchyMember(pydantic.BaseModel):
    contact_number: int
    name: Optional[str]
    role: Optional[str]


class HierarchyUnitMembers(pydantic.BaseModel):
    compass_id: int  # TODO disambiguate this
    member: list[HierarchyMember]


class HierarchyUnitMembersList(pydantic.BaseModel):
    __root__: list[HierarchyUnitMembers]
