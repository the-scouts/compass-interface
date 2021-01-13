import contextlib
import json
from pathlib import Path
from typing import Iterable

import requests

from compass._scrapers.hierarchy import HierarchyScraper
from compass.logging import logger

level_parent_map = {
    1: "Organisation",
    2: "Country",
    3: "Region",
    4: "County",
    5: "District",
    6: "Group",
}
parent_level_map = {v: k for k, v in level_parent_map.items()}

units = {
    1: "Countries",
    2: "Regions",
    3: "Counties",
    4: "Districts",
    5: "Groups",
}
sections = {
    1: "HQ Sections",
    2: "Country Sections",
    3: "Region Sections",
    4: "County Sections",
    5: "District Sections",
    6: "Group Sections",
}


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
    def _get_descendants_recursive(self, compass_id: int, hier_level: str = None, hier_num: int = None) -> dict:
        """Recursively get all children from given unit ID and level name/number, with caching"""
        if hier_num is not None:
            level_numeric = hier_num
        elif hier_level is not None:
            level_numeric = parent_level_map[hier_level]
            if not level_numeric:
                valid_values = list(parent_level_map.keys())
                raise ValueError(f"Passed level: {hier_level} is illegal. Valid values are {valid_values}")
        else:
            raise ValueError("A numeric or string hierarchy level needs to be passed")

        descendant_data = self.get_descendants_from_numeric_level(compass_id, level_numeric)

        for key, value in descendant_data.items():
            if key == "child" and value is not None:
                for child in value:
                    grandchildren = self._get_descendants_recursive(child["id"], hier_num=level_numeric + 1)
                    child.update(grandchildren)

        return descendant_data

    # See recurseRetrieve in PGS\Needle
    def get_descendants_from_numeric_level(self, parent_id: int, level_number: int) -> dict:
        logger.debug(f"getting data for unit {parent_id}")
        parent_level = level_parent_map[level_number]

        # All to handle as Group doesn't have grand-children
        children_and_sections = {
            "id": parent_id,
            "level": parent_level,
            "child": self._scraper.get_units_from_hierarchy(parent_id, units[level_number]) if level_number in units else None,
            "sections": self._scraper.get_units_from_hierarchy(parent_id, sections[level_number]),
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
