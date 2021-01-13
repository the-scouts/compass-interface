import datetime
import json

from lxml import html
import requests

from compass.interface_base import CompassInterfaceBase
from compass.settings import Settings
from compass.utility import compass_restify

endpoints = {
    "Countries": "/countries",
    "HQ Sections": "/hq/sections",
    "Regions": "/regions",
    "Country Sections": "/country/sections",
    "Counties": "/counties",
    "Region Sections": "/region/sections",
    "Districts": "/districts",
    "County Sections": "/county/sections",
    "Groups": "/groups",
    "District Sections": "/district/sections",
    "Group Sections": "/group/sections",
}


class CompassHierarchyScraper(CompassInterfaceBase):
    def __init__(self, session: requests.Session):
        super().__init__(session)

    # see CompassClient::retrieveLevel or retrieveSections in PGS\Needle php
    def get_units_from_hierarchy(self, parent_unit: int, level: str) -> list:
        """Get all children of a given unit

        TODO can we do this without needing to provide the level string?

        """

        # Get API endpoint from level
        level_endpoint = endpoints[level]

        # TODO PGS\Needle has `extra` bool in func signature to turn LiveData on/off
        result = self._post(f"{Settings.base_url}/hierarchy{level_endpoint}", json={"LiveData": "Y", "ParentID": f"{parent_unit}"})
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
            if unit_dict["Tag"]:  # TODO possible error states - what can we expect here as an invariant?
                tag = json.loads(unit_dict["Tag"])[0]
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
        self._post(f"{Settings.base_url}/Search/Members", json=compass_restify(data))

        # Fetch results from Compass
        search_results = self._get(f"{Settings.base_url}/SearchResults.aspx")

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
