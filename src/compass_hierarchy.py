import datetime
import io
import json

import pandas as pd
import requests
from lxml import html

from src.utility import CompassSettings


class CompassHierarchyScraper:
    def __init__(self):
        self._s = None

    @property
    def s(self):
        return self._s

    @s.setter
    def s(self, session: requests.sessions.Session):
        self._s = session

    def get_units_from_hierarchy(self, parent_unit: int, level: str, ) -> list:
        # Get API endpoint from level
        url_string = CompassHierarchy.hierarchy_levels.loc[CompassHierarchy.hierarchy_levels["type"] == level, "endpoint"].str.cat()

        CompassSettings.total_requests += 1
        result = self._s.post(f"{CompassSettings.base_url}/hierarchy{url_string}", json={"LiveData": "Y", "ParentID": f"{parent_unit}"}, verify=False)

        # Handle unauthorised access
        if result.json() == {'Message': 'Authorization has been denied for this request.'}:
            return [{"id": None, "name": None}]

        result_units = []
        for unit_dict in result.json():
            result_units.append({
                "id": int(unit_dict["Value"]),
                "name": unit_dict["Description"],
                "adults": json.loads(unit_dict["Tag"])[0]["Members"],
                # "parent_id": unit_dict["Parent"],
                # "section_type": json.loads(unit_dict["Tag"])[0]["SectionTypeDesc"],
            })

        return result_units

    def get_members_with_roles_in_unit(self, unit_number):
        # Construct request data
        # JSON data MUST be in the rather odd format of {"Key": key, "Value": value} for each (key, value) pair
        dt = datetime.datetime.now()
        dt_milli = dt.microsecond // 1000  # Get the the milliseconds from microseconds
        time_uid = f"{dt.hour}{dt.minute}{dt_milli}"
        data = {"SearchType": "HIERARCHY", "OrganisationNumber": unit_number, "UI": time_uid}
        rest_data = [{"Key": f"{k}", "Value": f"{v}"} for k, v in data.items()]

        # Execute search
        CompassSettings.total_requests += 1
        self._s.post(f"{CompassSettings.base_url}/Search/Members", json=rest_data, verify=False)

        # Fetch results from Compass
        CompassSettings.total_requests += 1
        search_results = self._s.get(f"{CompassSettings.base_url}/SearchResults.aspx", verify=False,)

        # Gets the compass form from the returned document
        form = html.fromstring(search_results.content).forms[0]

        # If the search hasn't worked the form returns an InvalidSearchError - check for this and raise an error if needed
        if form.action == './ScoutsPortal.aspx?Invalid=SearchError':
            raise Exception("Invalid Search")

        # Get the data and return it as a usable python object (list)
        member_data_string = form.fields['ctl00$plInnerPanel_head$txt_h_Data'] or '[]'
        member_data = json.loads(member_data_string)
        for member in member_data:
            del member['visibility_status']     # This is meaningless as we can only see Y people
            del member['address']               # This doesn't reliably give us postcode and is a lot of data
            del member['role']                  # This is Primary role and so not useful

        return member_data


class CompassHierarchy:
    # It is important that the separators are tabs, as there are spaces in the values
    hierarchy_levels = pd.read_csv(io.StringIO('''
    level	parent_level	type				endpoint			has_children
0	1		Organisation	Countries			/countries			True
1	1		Organisation	Org Sections		/hq/sections		False
2	2		Country			Regions				/regions			True
3	2		Country			Country Sections	/country/sections	False
4	3		Region			Counties			/counties			True
5	3		Region			Region Sections		/region/sections	False
6	4		County			Districts			/districts			True
7	4		County			County Sections		/county/sections	False
8	5		District		Groups				/groups				True
9	5		District		District Sections	/district/sections	False
10	6		Group			Group Sections		/group/sections		False
'''), engine='python', sep=r'\t+')

    def __init__(self, session: requests.sessions.Session):
        self._scraper = CompassHierarchyScraper()
        self._scraper.s = session

    def get_hierarchy(self, compass_id: int, level: str) -> dict:
        try:
            # Attempt to see if the hierarchy has been fetched already and is on the local system
            with open(f"hierarchy-{compass_id}.json", 'r', encoding='utf-8') as f:
                out = json.load(f)
                if out:
                    return out
        except FileNotFoundError:
            pass

        out = self._get_descendants_recursive(compass_id, hier_level=level)
        with open(f"hierarchy-{compass_id}.json", 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=4)
        return out

    def _get_descendants_recursive(self, compass_id: int, hier_level: str = None, hier_num: int = None) -> dict:
        if hier_num:
            level_numeric = hier_num
        elif hier_level:
            level_numeric = CompassHierarchy.hierarchy_levels.loc[CompassHierarchy.hierarchy_levels["parent_level"] == hier_level, "level"].min()
            if not level_numeric:
                raise ValueError(f"Passed level: {hier_level} is illegal. Valid values are {CompassHierarchy.hierarchy_levels['parent_level'].drop_duplicates().to_list()}")
        else:
            raise ValueError("A numeric or string hierarchy level needs to be passed")

        decedents_data = self.get_units_from_numeric_level(compass_id, level_numeric, )

        for key, value in decedents_data.items():
            if key == "child" and value is not None:
                for child in value:
                    child.update(self._get_descendants_recursive(child["id"], hier_num=level_numeric + 1, ))

        out = {"id": compass_id, **decedents_data}

        return out

    def get_units_from_numeric_level(self, parent_id: int, num_level: int, ) -> dict:
        print(f"getting data for unit {parent_id}")
        level_children = CompassHierarchy.hierarchy_levels.loc[CompassHierarchy.hierarchy_levels["level"] == num_level]
        parent_level = CompassHierarchy.hierarchy_levels.loc[CompassHierarchy.hierarchy_levels["level"] == num_level, "parent_level"].drop_duplicates().str.cat()

        # All to handle as Group doesn't have grand-children
        sections_list = level_children.loc[~level_children["has_children"], "type"].to_list()
        has_children = level_children.loc[level_children["has_children"], "type"].to_list()
        return {
            "level": parent_level,
            "child": self._scraper.get_units_from_hierarchy(parent_id, has_children[0], ) if has_children else None,
            "sections": self._scraper.get_units_from_hierarchy(parent_id, sections_list[0], ),
        }

    @staticmethod
    def _flatten_hierarchy_dict(hierarchy_dict: dict):
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

    def hierarchy_to_dataframe(self, hierarchy_dict):
        flat_hierarchy = self._flatten_hierarchy_dict(hierarchy_dict)
        dataframe = pd.DataFrame(flat_hierarchy)
        for field, dtype in dataframe.dtypes.items():
            if dtype.name == "float64":
                dataframe[field] = dataframe[field].astype("Int64")
        return dataframe

    def _get_all_members_in_hierarchy(self, parent_id: int, compass_ids: pd.Series) -> dict:
        try:
            # Attempt to see if the members dict has been fetched already and is on the local system
            with open(f"all-members-{parent_id}.json", 'r', encoding='utf-8') as f:
                all_members = json.load(f)
                if all_members:
                    return all_members
        except FileNotFoundError:
            pass

        all_members = {}
        for compass_id in compass_ids.drop_duplicates().to_list():
            print(f"Getting members for {compass_id}")
            all_members[compass_id] = self._scraper.get_members_with_roles_in_unit(compass_id)
        with open(f"all-members-{parent_id}.json", 'w', encoding='utf-8') as f:
            json.dump(all_members, f, ensure_ascii=False, indent=4)
        return all_members

    def get_all_members_table(self, parent_id: int, compass_ids: pd.Series) -> pd.DataFrame:
        members = self._get_all_members_in_hierarchy(parent_id, compass_ids)
        flat_members = [{"compass_id": compass, **member_dict} for compass, member_list in members.items() for member_dict in member_list]
        return pd.DataFrame(flat_members)
