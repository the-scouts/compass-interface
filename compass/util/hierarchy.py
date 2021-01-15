from typing import Generator, Optional, Iterable

import pandas as pd

from compass.hierarchy import Hierarchy


class HierarchyUtility(Hierarchy):
    def hierarchy_to_dataframe(self, hierarchy_dict) -> pd.DataFrame:
        flat_hierarchy = self._flatten_hierarchy_dict(hierarchy_dict)
        dataframe = pd.DataFrame(flat_hierarchy)
        for field, dtype in dataframe.dtypes.items():
            if dtype.name == "float64":
                dataframe[field] = dataframe[field].astype("Int64")
        return dataframe

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

    def get_all_members_table(self, parent_id: int, compass_ids: Iterable) -> pd.DataFrame:
        members = self._get_all_members_in_hierarchy(parent_id, compass_ids)
        flat_members = [{"compass_id": compass, **mem_dict} for compass, mem_list in members.items() for mem_dict in mem_list]
        return pd.DataFrame(flat_members)
