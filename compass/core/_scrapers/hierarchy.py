from __future__ import annotations

import json
import typing
from typing import Literal, TYPE_CHECKING, Union

from lxml import html
import pydantic

from compass.core.interface_base import InterfaceBase
from compass.core.schemas import hierarchy as schema
from compass.core.settings import Settings
from compass.core.utility import compass_restify

if TYPE_CHECKING:
    import requests

# TYPES_ENDPOINT_LEVELS values are meaningful values as they become the API endpoint paths
TYPES_ENDPOINT_LEVELS = Literal[
    "countries",
    "hq_sections",
    "regions",
    "country_sections",
    "counties",
    "region_sections",
    "districts",
    "county_sections",
    "groups",
    "district_sections",
    "group_sections",
]
endpoints = {i: f"/{i.replace('_', '/')}" for i in typing.get_args(TYPES_ENDPOINT_LEVELS)}


class HierarchyScraper(InterfaceBase):
    def __init__(self, session: requests.Session, validate: bool = False):
        """Constructor for HierarchyScraper.

        takes an initialised Session object from Logon
        """
        super().__init__(session)
        self.validate = validate

    gufh_native = list[dict[str, Union[int, str, None]]]
    gufh_pydantic = Union[schema.HierarchySection, schema.HierarchyUnit]

    # see CompassClient::retrieveLevel or retrieveSections in PGS\Needle php
    def get_units_from_hierarchy(self, parent_unit: int, level: TYPES_ENDPOINT_LEVELS) -> Union[gufh_native, gufh_pydantic, None]:
        """Get all children of a given unit.

        If LiveData=Y is passed, the resulting JSON additionally contains:
            - (duplicated) parent id
            - the unit address
            - number of members
            - SectionType1 and SectionTypeDesc1 keys, if requesting sections data

        TODO

        Args:
            parent_unit: The unit ID to get descendants from
            level: string org type, used for selecting API endpoint

        Returns:
            Mapping of unit properties to data.

            E.g.:
            {'id': ...,
             'name': '...',
             'parent_id': ...,
             'status': '...',
             'address': '...',
             'member_count': ...}

        Todo:
            can we do this without needing to provide the level string?
            raises? (from requests etc)

        """
        # Get API endpoint from level
        level_endpoint = endpoints[level]
        # Are we requesting sections here?
        is_sections = "/sections" in level_endpoint

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

        if self.validate:
            return pydantic.parse_obj_as(list[schema.HierarchySection if is_sections else schema.HierarchyUnit], result_units)
        else:
            return result_units

    gmwriu_native = dict[str, Union[int, str]]
    gmwriu_pydantic = schema.HierarchyMember

    def get_members_with_roles_in_unit(
        self, unit_number: int, include_name: bool = False, include_primary_role: bool = False
    ) -> list[Union[gmwriu_native, gmwriu_pydantic]]:
        """Get details of members with roles in a given unit.

        Keys within the member_data JSON are (as at 13/01/220):
         - contact_number (membership number)
         - name (member's name)
         - visibility_status (this is meaningless as we can only see Y people)
         - address (this doesn't reliably give us postcode and is a lot of data)
         - role (This is Primary role and so only sometimes useful)

        Args:
            unit_number: Compass unit number
            include_name: include member name in returned data
            include_primary_role: include primary role in returned data

        Returns:
            A list of member records. Keys are included through args

            E.g.:
            [
                {"contact_number": ..., ...},
                ...
            ]

        Todo:
            raises?

        """
        keys_to_keep = ("contact_number",)
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

        # parse the data and return it as a usable Python object (list)
        member_data = json.loads(member_data_string)
        if self.validate:
            return [schema.HierarchyMember(**{key: member[key] for key in keys_to_keep}) for member in member_data]
        else:
            return [{key: member[key] for key in keys_to_keep} for member in member_data]
