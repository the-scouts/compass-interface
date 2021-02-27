from __future__ import annotations

import contextlib
import enum
import json
from pathlib import Path
from typing import Iterable, Literal, Optional, TYPE_CHECKING, Union

from pydantic.json import pydantic_encoder

from compass.core import utility
from compass.core._scrapers.hierarchy import HierarchyScraper
from compass.core.logger import logger
from compass.core.logon import Logon
from compass.core.schemas import hierarchy as schema

if TYPE_CHECKING:
    from collections.abc import Iterator

TYPES_UNIT_LEVELS = Literal["Group", "District", "County", "Region", "Country", "Organisation"]


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
        self._scraper: HierarchyScraper = HierarchyScraper(session.s, session.cn, session.mrn, session.jk)
        self.session: Logon = session

    def get_unit_data(
        self,
        unit_level: Optional[schema.HierarchyLevel] = None,
        _id: Optional[int] = None,
        level: Optional[TYPES_UNIT_LEVELS] = None,
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
        elif _id is not None and level is not None:
            data = schema.HierarchyLevel(id=_id, level=level)
        elif use_default:
            data = self.session.hierarchy  # as this is a property, it will update when roles change
        else:
            raise ValueError("No level data specified! unit_level, id and level, or use_default must be set!")

        logger.debug(f"found unit data: id: {data.id}, level: {data.level}")

        return data

    # See recurseRetrieve in PGS\Needle
    def get_hierarchy(
        self,
        unit_level: Optional[schema.HierarchyLevel] = None,
        unit_id: Optional[int] = None,
        level: Optional[TYPES_UNIT_LEVELS] = None,
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
        unit_level = self.get_unit_data(unit_level, unit_id, level, use_default)

        filename = Path(f"hierarchy-{unit_level.id}.json")
        # Attempt to see if the hierarchy has been fetched already and is on the local system
        with contextlib.suppress(FileNotFoundError):
            out = json.loads(filename.read_text(encoding="utf-8"))
            if isinstance(out, dict):
                return schema.UnitData.parse_obj(out)

        # Fetch the hierarchy
        out = self._get_descendants_recursive(unit_level.id, hier_level=unit_level.level)

        # Try and write to a file for caching
        with utility.filesystem_guard("Unable to write cache file"):
            filename.write_text(schema.UnitData.parse_obj(out).json(ensure_ascii=False), encoding="utf-8")

        return schema.UnitData.parse_obj(out)

    # See recurseRetrieve in PGS\Needle
    def _get_descendants_recursive(
        self, compass_id: int, hier_level: Optional[TYPES_UNIT_LEVELS] = None, hier_num: Optional[Levels] = None
    ) -> dict[str, object]:
        """Recursively get all children from given unit ID and level name/number, with caching."""
        if hier_num is not None:
            level_numeric = hier_num
        elif hier_level is not None:
            try:
                level_numeric = Levels[hier_level]
            except KeyError:
                valid_levels = [level.name for level in Levels]
                raise ValueError(f"Passed level: {hier_level} is illegal. Valid values are {valid_levels}")
        else:
            raise ValueError("A numeric or string hierarchy level needs to be passed")

        logger.debug(f"getting data for unit {compass_id}")
        descendants = level_numeric in set(UnitChildren)  # Do child units exist? (i.e. is this level != group)

        # All to handle as Group doesn't have grand-children
        descendant_data = {"id": compass_id, "level": level_numeric.name}

        child_level = Levels(level_numeric + 1) if descendants else None
        if descendants:
            children = self._scraper.get_units_from_hierarchy(compass_id, UnitChildren(level_numeric).name)
            children_updated = []
            for child in children:
                if not child:
                    continue
                grandchildren = self._get_descendants_recursive(child.id, hier_num=child_level)
                children_updated.append(child.dict() | grandchildren)
            descendant_data["child"] = children_updated
        descendant_data["sections"] = self._scraper.get_units_from_hierarchy(compass_id, UnitSections(level_numeric).name)

        return descendant_data

    @staticmethod
    def flatten_hierarchy(hierarchy_dict: schema.UnitData) -> Iterator[dict[str, Union[int, str]]]:  # noqa: D417
        """Flattens a hierarchy tree / graph to a flat sequence of mappings.

        Args:
            hierarchy_dict:
                The current object to be flattened. The user will pass in a `schema.UnitData`
                object, whilst all recursion will be on `schema.DescendantData` objects.

        """
        # This args style is allowed, but not yet (2021-02-20) implemented in PyDocStyle, so D417 disabled above.
        # https://github.com/PyCQA/pydocstyle/issues/449

        def flatten(
            d: Union[schema.UnitData, schema.DescendantData], hierarchy_state: dict[str, Union[int, str]]
        ) -> Iterator[dict[str, Union[int, str]]]:
            """Generator expresion to recursively flatten hierarchy."""
            level_name = d.level
            compass_id = d.id
            name = d.name if "name" in hierarchy_dict.__fields__ else None  # ~900ns
            level_data = {
                **hierarchy_state,
                f"{level_name}_ID": compass_id,
                f"{level_name}_name": name,
            }
            yield {"compass": compass_id, "name": name, **level_data}
            for val in d.child or []:
                yield from flatten(val, level_data)
            for val in d.sections:
                yield {"compass": val.id, "name": val.name, **level_data}  # TODO section=True flag?

        return flatten(hierarchy_dict, dict())

    def get_unique_members(
        self,
        unit_level: Optional[schema.HierarchyLevel] = None,
        unit_id: Optional[int] = None,
        level: Optional[TYPES_UNIT_LEVELS] = None,
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
        unit_level = self.get_unit_data(unit_level, unit_id, level, use_default)

        # get tree of all units
        hierarchy_dict = self.get_hierarchy(unit_level)

        # flatten tree
        flat_hierarchy = self.flatten_hierarchy(hierarchy_dict)

        # generator for compass unit IDs
        compass_ids = (unit["compass"] for unit in flat_hierarchy)

        # get members from the list of IDs
        units_members = self.get_members_in_units(unit_level.id, compass_ids)

        # return a set of membership numbers
        return {members.contact_number for unit_members in units_members for members in unit_members.member}

    def get_members_in_units(self, parent_id: int, compass_ids: Iterable[int]) -> list[schema.HierarchyUnitMembers]:
        filename = Path(f"all-members-{parent_id}.json")

        with contextlib.suppress(FileNotFoundError):
            # Attempt to see if the members dict has been fetched already and is on the local system
            all_members = json.loads(filename.read_text(encoding="utf-8"))
            if isinstance(all_members, list):
                return [schema.HierarchyUnitMembers(**unit_members) for unit_members in all_members]

        # Fetch all members
        all_members = []
        for compass_id in set(compass_ids):
            logger.debug(f"Getting members for {compass_id}")
            all_members.append(dict(compass_id=compass_id, member=self._scraper.get_members_with_roles_in_unit(compass_id)))

        # Try and write to a file for caching
        with utility.filesystem_guard("Unable to write cache file"):
            filename.write_text(json.dumps(all_members, ensure_ascii=False, indent=4, default=pydantic_encoder), encoding="utf-8")

        return schema.HierarchyUnitMembersList.parse_obj(all_members).__root__
