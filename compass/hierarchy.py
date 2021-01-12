import datetime
import json

from pathlib import Path

import pandas as pd
import requests

from lxml import html

from compass.settings import Settings
from compass.utility import compass_restify


def create_hierarchy_levels() -> pd.DataFrame:
    data = pd.DataFrame(
        columns=["level", "type"],
        data=[
            [1, "Countries"],
            [1, "HQ Sections"],
            [2, "Regions"],
            [2, "Country Sections"],
            [3, "Counties"],
            [3, "Region Sections"],
            [4, "Districts"],
            [4, "County Sections"],
            [5, "Groups"],
            [5, "District Sections"],
            [6, "Group Sections"],
        ],
    )

    parent_level_map = {
        1: "Organisation",
        2: "Country",
        3: "Region",
        4: "County",
        5: "District",
        6: "Group",
    }

    data["parent_level"] = data["level"].map(parent_level_map)
    data["endpoint"] = "/" + data["type"].str.lower().str.replace(" ", "/", regex=False)
    data["has_children"] = data["endpoint"].str.rpartition("/").iloc[:, -1] != "sections"

    return data


class CompassHierarchyScraper:
    def __init__(self, session: requests.Session):
        self.s: requests.Session = session

    def get(self, url, **kwargs):
        Settings.total_requests += 1
        return self.s.get(url, **kwargs)

    def post(self, url, **kwargs):
        Settings.total_requests += 1
        data = kwargs.pop("data", None)
        json_ = kwargs.pop("json", None)
        return self.s.post(url, data=data, json=json_, **kwargs)

    # see CompassClient::retrieveLevel or retrieveSections in PGS\Needle php
    def get_units_from_hierarchy(self, parent_unit: int, level: str) -> list:
        """Get all children of a given unit

        TODO can we do this without needing to provide the level string?

        """

        # Get API endpoint from level
        level_endpoint = CompassHierarchy.hierarchy_levels.loc[
            CompassHierarchy.hierarchy_levels["type"] == level, "endpoint"
        ].str.cat()

        # TODO PGS\Needle has `extra` bool in func signature to turn LiveData on/off
        result = self.post(f"{Settings.base_url}/hierarchy{level_endpoint}", json={"LiveData": "Y", "ParentID": f"{parent_unit}"})
        result_json = result.json()

        # Handle unauthorised access
        if result_json == {"Message": "Authorization has been denied for this request."}:
            return [{"id": None, "name": None}]

        result_units = []
        for unit_dict in result_json:
            # TODO LiveData check here too
            parsed = {
                "id": int(unit_dict["Value"]),
                "name": unit_dict["Description"],
                "parent_id": unit_dict["Parent"],
            }

            if unit_dict["Tag"]:
                tag = json.loads(unit_dict["Tag"])[0]
                if tag:
                    parsed["status"] = tag.get("org_status")
                    parsed["address"] = tag.get("address")
                    parsed["member_count"] = tag.get("Members")
                    parsed["section_type"] = tag.get("SectionTypeDesc")

            result_units.append(parsed)

        return result_units

    def get_members_with_roles_in_unit(self, unit_number):
        # Construct request data

        dt = datetime.datetime.now()
        time_uid = f"{dt.hour}{dt.minute}{dt.microsecond // 1000}"
        data = {"SearchType": "HIERARCHY", "OrganisationNumber": unit_number, "UI": time_uid}

        # Execute search
        # JSON data MUST be in the rather odd format of {"Key": key, "Value": value} for each (key, value) pair
        self.post(f"{Settings.base_url}/Search/Members", json=compass_restify(data))

        # Fetch results from Compass
        search_results = self.get(f"{Settings.base_url}/SearchResults.aspx")

        # Gets the compass form from the returned document
        form = html.fromstring(search_results.content).forms[0]

        # If the search hasn't worked the form returns an InvalidSearchError - check for this and raise an error if needed
        if form.action == "./ScoutsPortal.aspx?Invalid=SearchError":
            raise Exception("Invalid Search")

        # Get the data and return it as a usable python object (list)
        member_data_string = form.fields["ctl00$plInnerPanel_head$txt_h_Data"] or "[]"
        member_data = json.loads(member_data_string)
        for member in member_data:
            del member["visibility_status"]  # This is meaningless as we can only see Y people
            del member["address"]  # This doesn't reliably give us postcode and is a lot of data
            del member["role"]  # This is Primary role and so not useful
        # member_data = [prop for member in member_data for prop in member if prop not in ["visibility_status", "address", "role"]]
        return member_data


class CompassHierarchy:
    hierarchy_levels = create_hierarchy_levels()

    def __init__(self, session: requests.Session):
        self._scraper = CompassHierarchyScraper(session)

    # See recurseRetrieve in PGS\Needle
    def get_hierarchy(self, compass_id: int, level: str) -> dict:
        """Recursively get all children from given unit ID and level, with caching"""
        filename = Path(f"hierarchy-{compass_id}.json")
        # Attempt to see if the hierarchy has been fetched already and is on the local system
        try:
            out = json.loads(filename.read_text(encoding="utf-8"))
            if out:
                return out
        except FileNotFoundError:
            pass

        # Fetch the hierarchy
        out = self._get_descendants_recursive(compass_id, hier_level=level)

        # Try and write to a file for caching
        try:
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(out, f, ensure_ascii=False)
        except IOError as e:
            print(f"Unable to write cache file: {e.errno} - {e.strerror}")

        return out

    # See recurseRetrieve in PGS\Needle
    def _get_descendants_recursive(self, compass_id: int, hier_level: str = None, hier_num: int = None) -> dict:
        """Recursively get all children from given unit ID and level name/number, with caching"""
        if hier_num is not None:
            level_numeric = hier_num
        elif hier_level is not None:
            level_numeric = CompassHierarchy.hierarchy_levels.loc[
                CompassHierarchy.hierarchy_levels["parent_level"] == hier_level, "level"
            ].min()
            if not level_numeric:
                valid_values = CompassHierarchy.hierarchy_levels["parent_level"].drop_duplicates().to_list()
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
        print(f"getting data for unit {parent_id}")
        mask = CompassHierarchy.hierarchy_levels["level"] == level_number
        level_children = CompassHierarchy.hierarchy_levels.loc[mask, ["has_children", "type"]]
        parent_level = CompassHierarchy.hierarchy_levels.loc[mask, "parent_level"].drop_duplicates().str.cat()

        # All to handle as Group doesn't have grand-children
        sections_list = level_children.loc[~level_children["has_children"], "type"].to_list()
        has_children = level_children.loc[level_children["has_children"], "type"].to_list()
        children_and_sections = {
            "id": parent_id,
            "level": parent_level,
            "child": self._scraper.get_units_from_hierarchy(parent_id, has_children[0]) if has_children else None,
            "sections": self._scraper.get_units_from_hierarchy(parent_id, sections_list[0]),
        }

        return children_and_sections

    def hierarchy_to_dataframe(self, hierarchy_dict):
        flat_hierarchy = self._flatten_hierarchy_dict(hierarchy_dict)
        dataframe = pd.DataFrame(flat_hierarchy)
        for field, dtype in dataframe.dtypes.items():
            if dtype.name == "float64":
                dataframe[field] = dataframe[field].astype("Int64")
        return dataframe

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

    def get_all_members_table(self, parent_id: int, compass_ids: pd.Series) -> pd.DataFrame:
        members = self._get_all_members_in_hierarchy(parent_id, compass_ids)
        flat_members = [{"compass_id": compass, **mem_dict} for compass, mem_list in members.items() for mem_dict in mem_list]
        return pd.DataFrame(flat_members)

    def _get_all_members_in_hierarchy(self, parent_id: int, compass_ids: pd.Series) -> dict:
        try:
            # Attempt to see if the members dict has been fetched already and is on the local system
            with open(f"all-members-{parent_id}.json", "r", encoding="utf-8") as f:
                all_members = json.load(f)
                if all_members:
                    return all_members
        except FileNotFoundError:
            pass

        # Fetch all members
        all_members = {}
        for compass_id in compass_ids.drop_duplicates().to_list():
            print(f"Getting members for {compass_id}")
            all_members[compass_id] = self._scraper.get_members_with_roles_in_unit(compass_id)

        # Try and write to a file for caching
        try:
            with open(f"all-members-{parent_id}.json", "w", encoding="utf-8") as f:
                json.dump(all_members, f, ensure_ascii=False, indent=4)
        except IOError as e:
            print(f"Unable to write cache file: {e.errno} - {e.strerror}")

        return all_members
