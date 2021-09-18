from __future__ import annotations

from typing import TYPE_CHECKING

import pandas as pd

from compass.core import hierarchy
import compass.core as ci

if TYPE_CHECKING:
    from collections.abc import Iterable

    from compass.core.schemas.hierarchy import UnitData


class HierarchyUtility(ci.Hierarchy):
    def hierarchy_to_dataframe(self, hierarchy_dict: UnitData) -> pd.DataFrame:
        flat_hierarchy = hierarchy._flatten_hierarchy(hierarchy_dict)
        dataframe = pd.DataFrame(flat_hierarchy)
        for field, dtype in dataframe.dtypes.items():
            if dtype.name == "float64":
                dataframe[field] = dataframe[field].astype("Int64")
        return dataframe

    def get_all_members_table(self, compass_ids: Iterable[int]) -> pd.DataFrame:
        members = self.units_members(compass_ids)
        return pd.DataFrame([dict(mem_dict) for mem_dict in members])
