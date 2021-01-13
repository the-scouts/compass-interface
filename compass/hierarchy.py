import contextlib
import enum
import json
from pathlib import Path
from typing import Iterable

import requests

from compass._scrapers.hierarchy import HierarchyScraper
from compass.logging import logger


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
    def __init__(self, session: requests.Session):
        self._scraper = HierarchyScraper(session)

    # See recurseRetrieve in PGS\Needle
    def get_hierarchy(self, compass_id: int, level: str) -> dict:
        """Recursively get all children from given unit ID and level, with caching"""
        filename = Path(f"hierarchy-{compass_id}.json")
        # Attempt to see if the hierarchy has been fetched already and is on the local system
        with contextlib.suppress(FileNotFoundError):
            out = json.loads(filename.read_text(encoding="utf-8"))
            if out:
                return out

        # Fetch the hierarchy
        out = self._get_descendants_recursive(compass_id, hier_level=level)

        # Try and write to a file for caching
        try:
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(out, f, ensure_ascii=False)
        except IOError as e:
            logger.error(f"Unable to write cache file: {e.errno} - {e.strerror}")

        return out

    # See recurseRetrieve in PGS\Needle
    def _get_descendants_recursive(self, compass_id: int, hier_level: str = None, hier_num: Levels = None) -> dict:
        """Recursively get all children from given unit ID and level name/number, with caching"""
        if hier_num is not None:
            level_numeric = hier_num
        elif hier_level is not None:
            try:
                level_numeric = Levels[hier_level]
            except KeyError:
                valid_values = [level.name for level in Levels]
                raise ValueError(f"Passed level: {hier_level} is illegal. Valid values are {valid_values}")
        else:
            raise ValueError("A numeric or string hierarchy level needs to be passed")

        descendant_data = self.get_descendants_from_numeric_level(compass_id, level_numeric)

        for key, value in descendant_data.items():
            if key == "child" and value is not None:
                for child in value:
                    child_level = Levels(level_numeric + 1)
                    grandchildren = self._get_descendants_recursive(child["id"], hier_num=child_level)
                    child.update(grandchildren)

        return descendant_data

    # See recurseRetrieve in PGS\Needle
    def get_descendants_from_numeric_level(self, parent_id: int, level_number: Levels) -> dict:
        logger.debug(f"getting data for unit {parent_id}")
        parent_level = level_number.name

        # All to handle as Group doesn't have grand-children
        children_and_sections = {
            "id": parent_id,
            "level": parent_level,
            "child": self._scraper.get_units_from_hierarchy(parent_id, UnitChildren(level_number).name) if level_number in set(UnitChildren) else None,
            "sections": self._scraper.get_units_from_hierarchy(parent_id, UnitSections(level_number).name),
        }

        return children_and_sections

    def get_unique_members(self, compass_id: int, level: str):
        # TODO this!!!
        raise NotImplementedError

    def _get_all_members_in_hierarchy(self, parent_id: int, compass_ids: Iterable) -> dict:
        with contextlib.suppress(FileNotFoundError):
            # Attempt to see if the members dict has been fetched already and is on the local system
            with open(f"all-members-{parent_id}.json", "r", encoding="utf-8") as f:
                all_members = json.load(f)
                if all_members:
                    return all_members

        # Fetch all members
        all_members = {}
        for compass_id in set(compass_ids):
            logger.debug(f"Getting members for {compass_id}")
            all_members[compass_id] = self._scraper.get_members_with_roles_in_unit(compass_id)

        # Try and write to a file for caching
        try:
            with open(f"all-members-{parent_id}.json", "w", encoding="utf-8") as f:
                json.dump(all_members, f, ensure_ascii=False, indent=4)
        except IOError as e:
            logger.error(f"Unable to write cache file: {e.errno} - {e.strerror}")

        return all_members
