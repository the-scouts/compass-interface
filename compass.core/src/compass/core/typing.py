"""This module exposes the public types for CI core."""

from compass.core.hierarchy import Hierarchy
from compass.core.interface import CompassInterface
from compass.core.logon import Logon
from compass.core.people import People
from compass.core.reports import Reports
from compass.core.schemas.hierarchy import DescendantData
from compass.core.schemas.hierarchy import HierarchyLevel
from compass.core.schemas.hierarchy import HierarchyMember
from compass.core.schemas.hierarchy import HierarchySection
from compass.core.schemas.hierarchy import HierarchyUnit
from compass.core.schemas.hierarchy import HierarchyUnitMembers
from compass.core.schemas.hierarchy import UnitData
from compass.core.schemas.logon import CompassProps
from compass.core.schemas.member import MemberAward
from compass.core.schemas.member import MemberDetails
from compass.core.schemas.member import MemberDisclosure
from compass.core.schemas.member import MemberMandatoryTraining
from compass.core.schemas.member import MemberPermit
from compass.core.schemas.member import MemberRoleCore
from compass.core.schemas.member import MemberRolePopup
from compass.core.schemas.member import MemberRolesCollection
from compass.core.schemas.member import MemberTrainingTab
from compass.core.types.hierarchy import TYPES_HIERARCHY_LEVELS
from compass.core.types.hierarchy import TYPES_UNIT_LEVELS
from compass.core.types.logon import TYPES_ORG_LEVELS
from compass.core.types.logon import TYPES_ROLE
from compass.core.types.member import AddressData
from compass.core.types.member import TYPES_ROLE_STATUS
from compass.core.types.reports import TYPES_EXPORTED_REPORTS
from compass.core.types.reports import TYPES_FORMAT_CODE
from compass.core.types.reports import TYPES_FORMAT_CODES
from compass.core.types.reports import TYPES_REPORTS

__all__ = (
    # objects
    "CompassInterface",
    "Logon",
    "Hierarchy",
    "People",
    "Reports",
    # types
    "TYPES_EXPORTED_REPORTS",
    "TYPES_FORMAT_CODE",
    "TYPES_FORMAT_CODES",
    "TYPES_HIERARCHY_LEVELS",
    "TYPES_ORG_LEVELS",
    "TYPES_REPORTS",
    "TYPES_ROLE",
    "TYPES_ROLE_STATUS",
    "TYPES_UNIT_LEVELS",
    "AddressData",
    # schemas
    "CompassProps",
    "DescendantData",
    "HierarchyLevel",
    "HierarchyMember",
    "HierarchySection",
    "HierarchyUnit",
    "HierarchyUnitMembers",
    "MemberAward",
    "MemberDetails",
    "MemberDisclosure",
    "MemberMandatoryTraining",
    "MemberPermit",
    "MemberRoleCore",
    "MemberRolePopup",
    "MemberRolesCollection",
    "MemberTrainingTab",
    "UnitData",
)
