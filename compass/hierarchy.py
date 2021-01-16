import contextlib
import enum
import json
from pathlib import Path
from typing import Generator, Iterable, Literal, Optional, Union

import requests

from compass._scrapers.hierarchy import HierarchyScraper
from compass.logging import logger
from compass.schemas import hierarchy as schema

TYPES_HIERARCHY_LEVEL = Literal["Organisation", "Country", "Region", "County", "District", "Group"]


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
    def __init__(self, session: requests.Session, validate: bool = False):
        self._scraper = HierarchyScraper(session)
        self.validate = validate

    # See recurseRetrieve in PGS\Needle
    def get_hierarchy(self, compass_id: int, level: TYPES_HIERARCHY_LEVEL) -> Union[dict, schema.UnitData]:
        """Recursively get all children from given unit ID and level, with caching"""
        filename = Path(f"hierarchy-{compass_id}.json")
        # Attempt to see if the hierarchy has been fetched already and is on the local system
        with contextlib.suppress(FileNotFoundError):
            out = json.loads(filename.read_text(encoding="utf-8"))
            if out:
                if self.validate:
                    return schema.UnitData.parse_obj(out)
                else:
                    return out

        # Fetch the hierarchy
        out = self._get_descendants_recursive(compass_id, hier_level=level)

        # Try and write to a file for caching
        try:
            if self.validate:
                filename.write_text(schema.UnitData.parse_obj(out).json(ensure_ascii=False), encoding="utf-8")
            else:
                filename.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
        except IOError as e:
            logger.error(f"Unable to write cache file: {e.errno} - {e.strerror}")

        if self.validate:
            return schema.UnitData.parse_obj(out)
        else:
            return out

    # See recurseRetrieve in PGS\Needle
    def _get_descendants_recursive(self, compass_id: int, hier_level: Optional[TYPES_HIERARCHY_LEVEL] = None, hier_num: Optional[Levels] = None) -> dict[str, Union[int, str, None]]:
        """Recursively get all children from given unit ID and level name/number, with caching"""
        if hier_level is hier_num is None:
            raise ValueError("A numeric or string hierarchy level needs to be passed")
        try:
            level_numeric = hier_num or Levels[hier_level]  # If hier_num is None, hier_level will be used
        except KeyError:
            raise ValueError(f"Passed level: {hier_level} is illegal. Valid values are {[level.name for level in Levels]}")

        logger.debug(f"getting data for unit {compass_id}")
        descendants = level_numeric in set(UnitChildren)  # Do child units exist? (i.e. is this level != group)

        # All to handle as Group doesn't have grand-children
        descendant_data = {
            "id": compass_id,
            "level": level_numeric.name,
            "child": self._scraper.get_units_from_hierarchy(compass_id, UnitChildren(level_numeric).name) if descendants else None,
            "sections": self._scraper.get_units_from_hierarchy(compass_id, UnitSections(level_numeric).name),
        }

        child_level = Levels(level_numeric + 1) if descendants else None
        for child in descendant_data.get("child") or []:
            grandchildren = self._get_descendants_recursive(child["id"], hier_num=child_level)
            child.update(grandchildren)

        return descendant_data

    @staticmethod
    def _flatten_hierarchy_dict(hierarchy_dict: dict) -> Generator:
        def flatten(d: dict, hierarchy_state: Optional[dict] = None) -> Generator:
            """Generator expresion to recursively flatten hierarchy"""
            level_name = d["level"]
            compass_id = d["id"]
            name = d.get("name")
            level_data = {
                **hierarchy_state,
                f"{level_name}_ID": compass_id,
                f"{level_name}_name": name,
            }
            yield {"compass": compass_id, "name": name, **level_data}
            for val in d["child"] or []:
                yield from flatten(val, level_data)
            for val in d["sections"]:
                yield {"compass": val["id"], "name": val["name"], **level_data}

        return flatten(hierarchy_dict, {})

    def get_unique_members(self, compass_id: int, level: TYPES_HIERARCHY_LEVEL) -> set[int]:
        """Get all unique members for a given level and its descendants"""
        # get tree of all units
        hierarchy_dict = self.get_hierarchy(compass_id, level)

        if self.validate:
            hierarchy_dict = hierarchy_dict.dict()

        # flatten tree
        flat_hierarchy = self._flatten_hierarchy_dict(hierarchy_dict)

        # generator for compass unit IDs
        compass_ids = (unit["compass"] for unit in flat_hierarchy)

        # get members from the list of IDs
        units_members = self._get_all_members_in_hierarchy(compass_id, compass_ids)

        # return a set of membership numbers
        return {members["contact_number"] for unit_members in units_members for members in unit_members["member"]}

    gamih_native = dict[str, Union[int, list[dict[str, Union[int, str]]]]]
    gamih_pydantic = schema.HierarchyUnitMembers

    def _get_all_members_in_hierarchy(self, parent_id: int, compass_ids: Iterable) -> list[Union[gamih_pydantic, gamih_native]]:
        with contextlib.suppress(FileNotFoundError):
            # Attempt to see if the members dict has been fetched already and is on the local system
            with open(f"all-members-{parent_id}.json", "r", encoding="utf-8") as f:
                all_members = json.load(f)
                if all_members:
                    return all_members

        # Fetch all members
        all_members = []
        for compass_id in set(compass_ids):
            logger.debug(f"Getting members for {compass_id}")
            all_members.append(dict(compass_id=compass_id, member=self._scraper.get_members_with_roles_in_unit(compass_id)))

        # Try and write to a file for caching
        try:
            with open(f"all-members-{parent_id}.json", "w", encoding="utf-8") as f:
                json.dump(all_members, f, ensure_ascii=False, indent=4)
        except IOError as e:
            logger.error(f"Unable to write cache file: {e.errno} - {e.strerror}")

        if self.validate:
            return schema.HierarchyUnitMembersList.parse_obj(all_members).__root__
        else:
            return all_members
