import pandas as pd

from compass.hierarchy import CompassHierarchy


class CompassHierarchyUtility(CompassHierarchy):
    def hierarchy_to_dataframe(self, hierarchy_dict) -> pd.DataFrame:
        flat_hierarchy = self._flatten_hierarchy_dict(hierarchy_dict)
        dataframe = pd.DataFrame(flat_hierarchy)
        for field, dtype in dataframe.dtypes.items():
            if dtype.name == "float64":
                dataframe[field] = dataframe[field].astype("Int64")
        return dataframe

    @staticmethod
    def _flatten_hierarchy_dict(hierarchy_dict: dict) -> list:
        def flatten(d: dict, hier: dict = None):
            id_label = f"{d['level']}_ID"
            name_label = f"{d['level']}_name"
            out = {
                **hier,
                id_label: d["id"],
                name_label: d.get("name"),
            }
            flat.append({"compass": d["id"], "name": d.get("name"), **out})
            for val in d["child"] or []:
                flatten(val, out)
            for val in d["sections"]:
                flat.append({"compass": val["id"], "name": val["name"], **out})

        flat = []
        flatten(hierarchy_dict, {})
        return flat

    def get_all_members_table(self, parent_id: int, compass_ids: pd.Series) -> pd.DataFrame:
        members = self._get_all_members_in_hierarchy(parent_id, compass_ids)
        flat_members = [{"compass_id": compass, **mem_dict} for compass, mem_list in members.items() for mem_dict in mem_list]
        return pd.DataFrame(flat_members)
