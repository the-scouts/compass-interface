from __future__ import annotations

from typing import Literal, Optional

import pydantic

from compass.core.types.hierarchy import TYPES_HIERARCHY_LEVELS
from compass.core.types.hierarchy import TYPES_SECTION
from compass.core.types.hierarchy import TYPES_UNIT_LEVELS


class HierarchyBase(pydantic.BaseModel):
    unit_id: int


class HierarchyUnit(HierarchyBase):
    name: str


class HierarchySection(HierarchyUnit):
    # section details (only if a section!)
    section_type: Optional[TYPES_SECTION]


class HierarchyLevel(HierarchyBase):
    level: TYPES_HIERARCHY_LEVELS


class UnitData(HierarchyBase):
    name: Literal[None] = None
    level: TYPES_UNIT_LEVELS  # can't be a section
    child: Optional[list[DescendantData]]  # NOTE: deliberate recursive/forward reference here!
    sections: list[HierarchySection]


class DescendantData(UnitData, HierarchyUnit):
    name: str  # type: ignore[assignment]  # override UnitData name=None


UnitData.update_forward_refs()  # NOTE: updating recursive/forward reference here!
DescendantData.update_forward_refs()  # NOTE: updating recursive/forward reference here!


class HierarchyMemberID(pydantic.BaseModel):
    contact_number: int


class HierarchyMember(HierarchyMemberID):
    name: Optional[str]
    role: Optional[str]


class HierarchyUnitMembers(HierarchyBase):
    members: list[HierarchyMember]
