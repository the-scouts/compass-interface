from __future__ import annotations

import enum
from typing import Iterable, Optional, TYPE_CHECKING, TypedDict, Union

from compass.core import errors
from compass.core._scrapers import hierarchy as scraper
from compass.core.logger import logger
from compass.core.logon import Logon
from compass.core.schemas import hierarchy as schema
from compass.core.util import cache_hooks

if TYPE_CHECKING:
    from collections.abc import Iterator


class HierarchyState(TypedDict, total=False):
    compass: int
    name: Optional[str]
    Organisation_ID: int
    Organisation_name: Optional[str]
    Country_ID: int
    Country_name: Optional[str]
    Region_ID: int
    Region_name: Optional[str]
    County_ID: int
    County_name: Optional[str]
    District_ID: int
    District_name: Optional[str]
    Group_ID: int
    Group_name: Optional[str]


class Levels(enum.IntEnum):
    Organisation = 1
    Country = 2
    Region = 3
    County = 4
    District = 5
    Group = 6


class UnitChildren(enum.IntEnum):
    countries = Levels.Organisation
    regions = Levels.Country
    counties = Levels.Region
    districts = Levels.County
    groups = Levels.District


class UnitSections(enum.IntEnum):
    hq_sections = Levels.Organisation
    country_sections = Levels.Country
    region_sections = Levels.Region
    county_sections = Levels.County
    district_sections = Levels.District
    group_sections = Levels.Group


class Hierarchy:
    def __init__(self, session: Logon):
        """Constructor for Hierarchy."""
        self._scraper: scraper.HierarchyScraper = scraper.HierarchyScraper(session._session)
        self.session: Logon = session

    def get_unit_level(
        self,
        unit_level: Optional[schema.HierarchyLevel] = None,
        unit_id: Optional[int] = None,
        level: Optional[schema.TYPES_UNIT_LEVELS] = None,
        use_default: bool = False,
    ) -> schema.HierarchyLevel:
        """Helper function to construct unit level data.

        Unit data can be specified as a pre-constructed model, by passing literals, or
        by signalling to use the data from the user's current role. If all three
        options are unset an exception is raised.

        There is a strict priority ordering as follows:
            1. pre-constructed pydantic model
            2. literals
            3. default data

        Returns:
            Constructed unit level data, as a pydantic model.
            e.g.:
                HierarchyLevel(id=..., level="...")

        Raises:
            ValueError:
                When no unit data information has been provided

        """
        if unit_level is not None:
            data = unit_level
        elif unit_id is not None and level is not None:
            data = schema.HierarchyLevel(unit_id=unit_id, level=level)
        elif use_default:
            data = self.session.hierarchy  # as this is a property, it will update when roles change
        else:
            raise errors.CompassError("No level data specified! unit_level, id and level, or use_default must be set!")

        logger.debug(f"found unit data: id: {data.unit_id}, level: {data.level}")

        return data

    # See recurseRetrieve in PGS\Needle
    @cache_hooks.cache_result(key=("hierarchy", 1), model_type=schema.UnitData)
    def get_hierarchy(
        self,
        unit_id: Optional[int] = None,
        level: Optional[schema.TYPES_UNIT_LEVELS] = None,
        use_default: bool = False,
    ) -> schema.UnitData:
        """Gets all units at given level and below, including sections.

        Unit data can be specified as a pre-constructed model, by passing literals, or
        by signalling to use the data from the user's current role. If all three
        options are unset an exception is raised.

        There is a strict priority ordering as follows:
            1. pre-constructed pydantic model
            2. literals
            3. default data

        Raises:
            ValueError:
                When no unit data information has been provided

        """
        # Fetch the hierarchy
        unit_level = self.get_unit_level(None, unit_id, level, use_default)
        return schema.UnitData.parse_obj(self._get_descendants_recursive(unit_level.unit_id, hier_level=unit_level.level))

    # See recurseRetrieve in PGS\Needle
    def _get_descendants_recursive(
        self, unit_id: int, hier_level: Optional[schema.TYPES_UNIT_LEVELS] = None, hier_num: Optional[Levels] = None
    ) -> dict[str, object]:
        """Recursively get all children from given unit ID and level name/number, with caching."""
        if hier_num is not None:
            level_numeric = hier_num
        elif hier_level is not None:
            try:
                level_numeric = Levels[hier_level]
            except KeyError:
                valid_levels = [level.name for level in Levels]
                raise errors.CompassError(f"Passed level: {hier_level} is illegal. Valid values are {valid_levels}") from None
        else:
            raise errors.CompassError("A numeric or string hierarchy level needs to be passed")

        logger.debug(f"getting data for unit {unit_id}")
        # Do child units exist? (i.e. is this level != group)
        descendants = level_numeric in set(UnitChildren)  # type: ignore[comparison-overlap]

        # All to handle as Group doesn't have grand-children
        descendant_data = {"unit_id": unit_id, "level": level_numeric.name}

        child_level = Levels(level_numeric + 1) if descendants else None
        if descendants:
            children = self._scraper.get_units_from_hierarchy(unit_id, UnitChildren(level_numeric).name)  # type: ignore[arg-type]
            children_updated = []
            for child in children:
                if not child:
                    continue
                grandchildren = self._get_descendants_recursive(child.unit_id, hier_num=child_level)
                children_updated.append(child.dict() | grandchildren)
            descendant_data["child"] = children_updated
        section_level: scraper.TYPES_ENDPOINT_LEVELS = UnitSections(level_numeric).name  # type: ignore[assignment]
        descendant_data["sections"] = self._scraper.get_units_from_hierarchy(unit_id, section_level)

        return descendant_data

    def get_unique_members(
        self,
        unit_id: Optional[int] = None,
        level: Optional[schema.TYPES_UNIT_LEVELS] = None,
        use_default: bool = False,
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
            ValueError:
                When no unit data information has been provided

        """
        unit_level = self.get_unit_level(None, unit_id, level, use_default)

        # get tree of all units
        hierarchy_dict = self.get_hierarchy(unit_level.unit_id, unit_level.level)

        # flatten tree
        flat_hierarchy = flatten_hierarchy(hierarchy_dict)

        # generator for compass unit IDs
        compass_ids = (unit["compass"] for unit in flat_hierarchy)

        # get members from the list of IDs
        units_members = self.get_members_in_units(unit_level.unit_id, compass_ids)

        # return a set of membership numbers
        return {members.contact_number for unit_members in units_members for members in unit_members.members}

    @cache_hooks.cache_result(key=("all-members", 1), model_type=list[schema.UnitData])
    def get_members_in_units(self, _cache_key: int, compass_ids: Iterable[int]) -> list[schema.HierarchyUnitMembers]:
        # Fetch all members
        all_members = []
        for unit_id in set(compass_ids):
            logger.debug(f"Getting members for {unit_id}")
            data = schema.HierarchyUnitMembers(unit_id=unit_id, members=self._scraper.get_members_with_roles_in_unit(unit_id))
            all_members.append(data)
        return all_members


def flatten_hierarchy(hierarchy_dict: schema.UnitData) -> Iterator[HierarchyState]:  # noqa: D417 (hanging indent)
    """Flattens a hierarchy tree / graph to a flat sequence of mappings.

    Args:
        hierarchy_dict:
            The current object to be flattened. The user will pass in a `schema.UnitData`
            object, whilst all recursion will be on `schema.DescendantData` objects.

    """
    # This args style is allowed, but not yet (2021-03-20) implemented in PyDocStyle, so D417 disabled above.
    # https://github.com/PyCQA/pydocstyle/issues/449
    def flatten(d: Union[schema.UnitData, schema.DescendantData], hierarchy_state: HierarchyState) -> Iterator[HierarchyState]:
        """Generator expresion to recursively flatten hierarchy."""
        level_name = d.level
        unit_id = d.unit_id
        name = d.name if isinstance(d, schema.DescendantData) else None
        level_data = hierarchy_state | {f"{level_name}_ID": unit_id, f"{level_name}_name": name}  # type: ignore[operator]
        yield {"compass": unit_id, "name": name, "section": False} | level_data
        for child in d.child or []:
            yield from flatten(child, level_data)
        for section in d.sections:
            yield {"compass": section.unit_id, "name": section.name, "section": True} | level_data

    blank_state: HierarchyState = dict()
    return flatten(hierarchy_dict, blank_state)
