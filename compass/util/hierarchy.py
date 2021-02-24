from __future__ import annotations

from typing import TYPE_CHECKING

import pandas as pd

from compass import Hierarchy

if TYPE_CHECKING:
    from collections.abc import Iterable

    from compass.core.schemas.hierarchy import UnitData


class HierarchyUtility(Hierarchy):
    def hierarchy_to_dataframe(self, hierarchy_dict: UnitData) -> pd.DataFrame:
        flat_hierarchy = self.flatten_hierarchy(hierarchy_dict)
        dataframe = pd.DataFrame(flat_hierarchy)
        for field, dtype in dataframe.dtypes.items():
            if dtype.name == "float64":
                dataframe[field] = dataframe[field].astype("Int64")
        return dataframe

    def get_all_members_table(self, parent_id: int, compass_ids: Iterable) -> pd.DataFrame:
        members = self.get_members_in_units(parent_id, compass_ids)
        flat_members = [{"compass_id": compass, **mem_dict} for compass, mem_list in members.items() for mem_dict in mem_list]
        return pd.DataFrame(flat_members)
