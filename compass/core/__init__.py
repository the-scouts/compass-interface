"""Compass Interface - Core!

This module exposes the public api for CI core
"""
from __future__ import annotations

from compass.core import logger
from compass.core.errors import CompassAuthenticationError
from compass.core.errors import CompassError
from compass.core.errors import CompassNetworkError
from compass.core.errors import CompassPermissionError
from compass.core.errors import CompassReportError
from compass.core.errors import CompassReportPermissionError
from compass.core.hierarchy import Hierarchy
from compass.core.logon import Logon
from compass.core.people import People
from compass.core.reports import Reports
from compass.core.reports import TYPES_REPORTS
from compass.core.schemas.hierarchy import DescendantData
from compass.core.schemas.hierarchy import HierarchyLevel
from compass.core.schemas.hierarchy import HierarchyMember
from compass.core.schemas.hierarchy import HierarchySection
from compass.core.schemas.hierarchy import HierarchyUnit
from compass.core.schemas.hierarchy import HierarchyUnitMembers
from compass.core.schemas.hierarchy import TYPES_HIERARCHY_LEVELS
from compass.core.schemas.hierarchy import TYPES_UNIT_LEVELS
from compass.core.schemas.hierarchy import UnitData
from compass.core.schemas.logon import CompassProps
from compass.core.schemas.logon import TYPES_ORG_LEVELS
from compass.core.schemas.logon import TYPES_ROLE
from compass.core.schemas.member import AddressData
from compass.core.schemas.member import MemberAward
from compass.core.schemas.member import MemberDetails
from compass.core.schemas.member import MemberDisclosure
from compass.core.schemas.member import MemberMandatoryTraining
from compass.core.schemas.member import MemberPermit
from compass.core.schemas.member import MemberRoleCore
from compass.core.schemas.member import MemberRolePopup
from compass.core.schemas.member import MemberRolesCollection
from compass.core.schemas.member import MemberTrainingTab
from compass.core.schemas.member import TYPES_ROLE_STATUS
from compass.core.settings import Settings


class CompassInterface:
    def __init__(self, user_props: Logon, /):
        """This is the main (programmatic) interface to CI core."""
        self.user = user_props
        self.people = People(user_props)
        self.hierarchy = Hierarchy(user_props)
        self.reports = Reports(user_props)


def login(username: str, password: str, /, *, role: str | None = None, location: str | None = None) -> CompassInterface:
    """Log in to compass, return a compass.logon.Logon object.

    This function is provided as a convenient interface to the logon module.
    """
    return CompassInterface(Logon.from_logon((username, password), role, location))


__all__ = (
    # public sub-modules
    "logger",
    # public classes
    "CompassInterface",
    "Logon",
    "Hierarchy",
    "People",
    "Reports",
    "Settings",
    # public exceptions
    "CompassError",
    "CompassAuthenticationError",
    "CompassNetworkError",
    "CompassPermissionError",
    "CompassReportError",
    "CompassReportPermissionError",
    # public functions
    "login",
    # public types
    "TYPES_HIERARCHY_LEVELS",
    "TYPES_ORG_LEVELS",
    "TYPES_REPORTS",
    "TYPES_ROLE",
    "TYPES_ROLE_STATUS",
    "TYPES_UNIT_LEVELS",
    "AddressData",
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
