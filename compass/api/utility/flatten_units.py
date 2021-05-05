from __future__ import annotations

import json
from pathlib import Path
from typing import NamedTuple, TYPE_CHECKING, Union

from compass.core.logon import Logon
from compass.core.settings import Settings
from compass.core.schemas import hierarchy as schema
import compass.core as ci

if TYPE_CHECKING:
    from collections.abc import Iterator

RESOURCE_FOLDER = Path(__file__, "../../resources").resolve()
TREE_PATH = RESOURCE_FOLDER.joinpath("hierarchy_tree.json")
FLAT_PATH = RESOURCE_FOLDER.joinpath("hierarchy_flat.json")


class UnitRecord(NamedTuple):
    name: str
    parent: int
    children: Union[dict[int, str], None]
    sections: Union[dict[int, str], None]


def _flatten_hierarchy(d: Union[schema.UnitData, schema.DescendantData], parent_id: int) -> Iterator[tuple[int, UnitRecord]]:
    unit_id = d.unit_id
    sections = {section.unit_id: section.name for section in d.sections} or None
    children = {child.unit_id: child.name for child in d.child} if d.child else None
    yield unit_id, UnitRecord(d.name, parent_id, children, sections)
    for child in d.child or []:
        yield from _flatten_hierarchy(child, unit_id)
    for section in d.sections:
        yield section.unit_id, UnitRecord(section.name, unit_id, None, None)


def make_hierarchy_resource(session: Logon) -> dict[int, UnitRecord]:
    full_hierarchy = ci.Hierarchy(session).unit_data(Settings.org_number, "Organisation")
    full_hierarchy.name = "The Scout Association"
    TREE_PATH.write_text(full_hierarchy.json(ensure_ascii=False), encoding="utf-8")
    flat_hierarchy = dict(_flatten_hierarchy(full_hierarchy, Settings.org_number))
    FLAT_PATH.write_text(json.dumps(flat_hierarchy, ensure_ascii=False), encoding="utf-8")
    return flat_hierarchy


def load_hierarchy_map(path: Path = FLAT_PATH) -> dict[int, UnitRecord]:
    json_hierarchy = json.loads(path.read_text(encoding="utf-8"))
    return {int(unit_id): UnitRecord(*unit_data) for unit_id, unit_data in json_hierarchy.items()}
