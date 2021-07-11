from __future__ import annotations

from typing import Iterable, Optional, TYPE_CHECKING, TypedDict, Union

import compass.core as ci
from compass.core._scrapers import hierarchy as scraper
from compass.core.logger import logger
from compass.core.schemas import hierarchy as schema
from compass.core.util import cache_hooks

if TYPE_CHECKING:
    from collections.abc import Iterator

    from compass.core.util.client import Client

    class _HierarchyState(TypedDict, total=False):
        unit_id: int
        name: Optional[str]
        # organisation: int  # Always 10000001; mildly redundant
        country: int
        region: int
        county: int
        district: int
        group: int

    _TYPES_LEVEL = tuple[Optional[ci.TYPES_UNIT_LEVELS], Optional[scraper.TYPES_ENDPOINT_LEVELS], scraper.TYPES_ENDPOINT_LEVELS]


# Holds unit level metadata. Keys are from `schema.TYPES_UNIT_LEVELS`, values
# are a three-tuple of child level, unit level endpoint, and unit  level
# section endpoint.
# Suppress PyCharm inspection (not great at literals)
# noinspection PyTypeChecker
_levels: dict[ci.TYPES_UNIT_LEVELS, _TYPES_LEVEL] = {
    # "Group": (None, None, "group_sections"),
    "District": ("Group", "groups", "district_sections"),
    "County": ("District", "districts", "county_sections"),
    "Region": ("County", "counties", "region_sections"),
    "Country": ("Region", "regions", "country_sections"),
    "Organisation": ("Country", "countries", "hq_sections"),
}


class Hierarchy:
    def __init__(self, session: ci.Logon):
        """Constructor for Hierarchy."""
        self.client: Client = session._client
        self.default_hierarchy: ci.HierarchyLevel = session.hierarchy

    # See recurseRetrieve in PGS\Needle
    @cache_hooks.cache_result(key=("hierarchy", 1), model_type=schema.UnitData)
    def unit_data(
        self,
        unit_id: Optional[int] = None,
        level: Optional[ci.TYPES_HIERARCHY_LEVELS] = None,
        use_default: bool = False,
        recurse_children: bool = True,
    ) -> ci.UnitData:
        """Gets all units at given level and below, including sections.

        Unit data can be specified as a pre-constructed model, by passing literals, or
        by signalling to use the data from the user's current role. If all three
        options are unset an exception is raised.

        There is a strict priority ordering as follows:
            1. pre-constructed pydantic model
            2. literals
            3. default data

        Args:
            unit_id: Compass unit ID to get data for
            level: Level for unit ID (Group, District, ...)
            use_default: Use current role's hierarchy level (overridden by explicit unit_id/level)
            recurse_children: Return all data down to group sections, or just immediate children

        Raises:
            CompassError:
                When no unit data information has been provided

        """
        if use_default:
            unit_meta = self.default_hierarchy
        elif unit_id is not None and level is not None:
            unit_meta = ci.HierarchyLevel(unit_id=unit_id, level=level)
        else:
            raise ci.CompassError("No level data specified! Either `use_default` or both `unit_id` and `level` must be set!")
        # Fetch the hierarchy
        return ci.UnitData.parse_obj(_get_descendants_level(self.client, unit_meta, recurse_children))

    def unique_members(
        self,
        unit_id: Optional[int] = None,
        level: Optional[ci.TYPES_HIERARCHY_LEVELS] = None,
        use_default: bool = False,
        recurse_children: bool = True,
    ) -> set[int]:
        """Get all unique members for a given level and its descendants.

        Unit data can be specified as a pre-constructed model, by passing literals, or
        by signalling to use the data from the user's current role. If all three
        options are unset an exception is raised.

        There is a strict priority ordering as follows:
            1. pre-constructed pydantic model
            2. literals
            3. default data

        Returns:
            A set of unique member numbers within the given unit.

        Raises:
            CompassError:
                When no unit data information has been provided

        """
        # get tree of all units
        hierarchy_dict = self.unit_data(unit_id, level, use_default, recurse_children)

        # flatten tree
        flat_hierarchy = _flatten_hierarchy(hierarchy_dict)

        # generator for compass unit IDs
        compass_ids = (unit["unit_id"] for unit in flat_hierarchy)

        # get members from the list of IDs
        seen: set[int] = set()  # Unit ID deduplication
        add = seen.add
        unit_member_lists = (self.unit_members(sub_id) for sub_id in compass_ids if (sub_id not in seen and not add(sub_id)))

        # return a set of membership numbers
        return {members.contact_number for unit_member_list in unit_member_lists for members in unit_member_list}

    def units_members(self, unit_ids: Iterable[int]) -> Iterator[ci.HierarchyUnitMembers]:
        """Fetch all members from an iterable of unit IDs."""
        seen = set()  # Unit ID cache
        for unit_id in unit_ids:
            if unit_id in seen:
                continue
            seen.add(unit_id)  # store already fetched unit IDs
            yield ci.HierarchyUnitMembers(unit_id=unit_id, members=self.unit_members(unit_id))

    def unit_members(self, unit_id: int) -> list[ci.HierarchyMember]:
        logger.debug(f"Getting members for {unit_id}")
        return scraper.get_members_with_roles_in_unit(self.client, unit_id)


def _get_descendants_level(client: Client, unit_meta: ci.HierarchyLevel, recurse_children: bool) -> dict[str, object]:
    # short-circuit if level type is a section hierarchy type
    if unit_meta.level not in _levels:
        return {"unit_id": unit_meta.unit_id, "level": unit_meta.level, "child": [], "sections": []}
    if recurse_children:
        return _get_descendants_recursive(client, unit_meta.unit_id, unit_meta.level)  # type: ignore[arg-type]
    return _get_descendants_immediate(client, unit_meta.unit_id, unit_meta.level)  # type: ignore[arg-type]


# See recurseRetrieve in PGS\Needle
def _get_descendants_recursive(client: Client, unit_id: int, level_name: ci.TYPES_UNIT_LEVELS, /) -> dict[str, object]:
    """Recursively get all children from given unit ID and level."""
    logger.debug(f"getting data for unit {unit_id}")

    # All to handle as Group doesn't have grand-children
    unit_data: dict[str, object] = {"unit_id": unit_id, "level": level_name}

    # Do child units exist? (i.e. is this level != group)
    child_level, endpoint_children, endpoint_sections = _levels[level_name]
    if endpoint_children and child_level:
        children = scraper.get_units_from_hierarchy(client, unit_id, endpoint_children)
        # extend children with grandchildren
        unit_data["child"] = [child.__dict__ | _get_descendants_recursive(client, child.unit_id, child_level) for child in children]
    unit_data["sections"] = scraper.get_units_from_hierarchy(client, unit_id, endpoint_sections)

    return unit_data


def _get_descendants_immediate(client: Client, unit_id: int, level_name: ci.TYPES_UNIT_LEVELS, /) -> dict[str, object]:
    """Recursively get all children from given unit ID and level."""
    logger.debug(f"getting data for unit {unit_id}")

    # All to handle as Group doesn't have grand-children
    unit_data: dict[str, object] = {"unit_id": unit_id, "level": level_name}

    # Do child units exist? (i.e. is this level != group)
    child_level_name, endpoint_children, endpoint_sections = _levels[level_name]
    if endpoint_children:
        blank_descendant_data: dict[str, object] = {"level": child_level_name, "child": None, "sections": []}
        children = scraper.get_units_from_hierarchy(client, unit_id, endpoint_children)
        unit_data["child"] = [child.__dict__ | blank_descendant_data for child in children]
    unit_data["sections"] = scraper.get_units_from_hierarchy(client, unit_id, endpoint_sections)
    return unit_data


def _flatten_hierarchy(hierarchy_dict: ci.UnitData) -> Iterator[_HierarchyState]:  # noqa: D417 (hanging indent)
    """Flattens a hierarchy tree / graph to a flat sequence of mappings.

    Args:
        hierarchy_dict:
            The current object to be flattened. The user will pass in a `ci.UnitData`
            object, whilst all recursion will be on `ci.DescendantData` objects.

    """
    # This args style is allowed, but not yet (2021-03-20) implemented in PyDocStyle, so D417 disabled above.
    # https://github.com/PyCQA/pydocstyle/issues/449
    blank_state: _HierarchyState = {}
    return _flatten(hierarchy_dict, blank_state)


def _flatten(d: Union[ci.UnitData, ci.DescendantData], hierarchy_state: _HierarchyState) -> Iterator[_HierarchyState]:
    """Generator expresion to recursively flatten hierarchy."""
    unit_id = d.unit_id
    level_data = hierarchy_state | {d.level.lower(): unit_id}  # type: ignore[operator]
    yield {"unit_id": unit_id, "name": d.name, "section": False} | level_data  # type: ignore[misc]
    for child in d.child or []:
        yield from _flatten(child, level_data)  # type: ignore[arg-type]
    for section in d.sections:
        yield {"unit_id": section.unit_id, "name": section.name, "section": True} | level_data  # type: ignore[misc]
