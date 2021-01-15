import datetime
import json

from lxml import html
import requests

from compass.interface_base import InterfaceBase
from compass.settings import Settings
from compass.utility import compass_restify

endpoints = {
    "countries": "/countries",
    "hq_sections": "/hq/sections",
    "regions": "/regions",
    "country_sections": "/country/sections",
    "counties": "/counties",
    "region_sections": "/region/sections",
    "districts": "/districts",
    "county_sections": "/county/sections",
    "groups": "/groups",
    "district_sections": "/district/sections",
    "group_sections": "/group/sections",
}


class HierarchyScraper(InterfaceBase):
    def __init__(self, session: requests.Session):
        super().__init__(session)

    # see CompassClient::retrieveLevel or retrieveSections in PGS\Needle php
    def get_units_from_hierarchy(self, parent_unit: int, level: str) -> list:
        """Get all children of a given unit

        If LiveData=Y is passed, the resulting JSON additionally contains:
            - (duplicated) parent id
            - the unit address
            - number of members
            - SectionType1 and SectionTypeDesc1 keys, if requesting sections data

        TODO can we do this without needing to provide the level string?

        """

        # Get API endpoint from level
        level_endpoint = endpoints[level]

        result = self._post(f"{Settings.base_url}/hierarchy{level_endpoint}", json={"LiveData": "Y", "ParentID": f"{parent_unit}"})
        result_json = result.json()

        # Handle unauthorised access TODO raise???
        if result_json == {"Message": "Authorization has been denied for this request."}:
            return [{"id": None, "name": None}]

        result_units = []
        for unit_dict in result_json:
            parsed = {
                "id": int(unit_dict["Value"]),
                "name": unit_dict["Description"],
                "parent_id": unit_dict["Parent"],
            }
            if unit_dict["Tag"]:  # TODO possible error states - what can we expect here as an invariant?
                tag = json.loads(unit_dict["Tag"])[0]
                parsed["status"] = tag["org_status"]
                parsed["address"] = tag["address"]
                parsed["member_count"] = tag["Members"]
                # Only include section_type if there is section type data
                if "SectionTypeDesc" in tag:
                    parsed["section_type"] = tag["SectionTypeDesc"]

            result_units.append(parsed)

        return result_units

    def get_members_with_roles_in_unit(self, unit_number: int, include_name: bool = False, include_primary_role: bool = False) -> list:
        """Get details of members with roles in a given unit

        Keys within the member_data JSON are (as at 13/01/220):
         - contact_number (membership number)
         - name (member's name)
         - visibility_status (this is meaningless as we can only see Y people)
         - address (this doesn't reliably give us postcode and is a lot of data)
         - role (This is Primary role and so only sometimes useful)

        """
        keys_to_keep = ("contact_number", )
        if include_name:
            keys_to_keep = (*keys_to_keep, "name")
        if include_primary_role:
            keys_to_keep = (*keys_to_keep, "role")
        # Construct request data

        # It seems like the time UID value can be constant -- keeping old code in case something breaks
        # dt = datetime.datetime.now()
        # time_uid = f"{dt.hour}{dt.minute}{dt.microsecond // 1000}"
        time_uid = str(12_34_567)
        data = {"SearchType": "HIERARCHY", "OrganisationNumber": unit_number, "UI": time_uid}

        # Execute search
        # JSON data MUST be in the rather odd format of {"Key": key, "Value": value} for each (key, value) pair
        self._post(f"{Settings.base_url}/Search/Members", json=compass_restify(data))

        # Fetch results from Compass
        search_results = self._get(f"{Settings.base_url}/SearchResults.aspx")

        # Gets the compass form from the returned document
        form = html.fromstring(search_results.content).forms[0]
        del search_results

        # If the search hasn't worked the form returns an InvalidSearchError - check for this and raise an error if needed
        if form.action == "./ScoutsPortal.aspx?Invalid=SearchError":
            raise Exception("Invalid Search")

        # Get the encoded JSON data from the HTML
        member_data_string = form.fields["ctl00$plInnerPanel_head$txt_h_Data"] or "[]"
        del form

        # parse the data and return it as a usable python object (list)
        member_data = json.loads(member_data_string)
        return [{key: member[key] for key in keys_to_keep} for member in member_data]
