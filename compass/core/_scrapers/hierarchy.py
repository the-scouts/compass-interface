from __future__ import annotations

import json
from typing import get_args, Literal, TYPE_CHECKING

from lxml import html

import compass.core as ci
from compass.core.settings import Settings
from compass.core.util.compass_helpers import compass_restify

if TYPE_CHECKING:
    from compass.core.util.client import Client

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
endpoints = {i: f"/{i.replace('_', '/')}" for i in get_args(TYPES_ENDPOINT_LEVELS)}
section_type_map = {
    "Early Years Pilot": "EY Pilot",
    "Beavers": "Beavers",
    "Beaver Scout": "Beavers",
    "Cub Scout": "Cubs",
    "Scout": "Scouts",
    "Explorer Scouts": "Explorers",
    "Scout Network": "Network",
    "Scout Active Support": "ASU",
    "All": "Other",
    "Other": "Other",
}


# see CompassClient::retrieveLevel or retrieveSections in PGS\Needle php
def get_units_from_hierarchy(client: Client, parent_unit: int, level: TYPES_ENDPOINT_LEVELS) -> list[ci.HierarchyUnit]:
    """Get all children of a given unit.

    If LiveData=Y is passed, the resulting JSON additionally contains:
        - (duplicated) parent id
        - the unit address
        - number of members
        - section type details, if requesting sections data

    Args:
        client: HTTP client
        parent_unit: The unit ID to get descendants from
        level: string org type, used for selecting API endpoint

    Returns:
        List of HierarchySection or HierarchyUnit models. If the current
        user cannot access the hierarchy unit, an empty list is returned.

        Returned lists have uniform types (i.e. all elements are of type
        HierarchySection or of type HierarchyUnit, they cannot mix)

        E.g.:
        [
            HierarchyUnit(
                unit_id=...,
                name='...',
                parent_id=...,
                status='...',
                address='...',
                member_count=...
            ),
            ...
        ]

    Raises:
        CompassNetworkError:
            For errors while executing the HTTP call

    """
    # Get API endpoint from level
    level_endpoint = endpoints[level]
    # Are we requesting sections here?
    is_sections = "/sections" in level_endpoint
    model_class = ci.HierarchySection if is_sections else ci.HierarchyUnit  # chose right model to use

    # LiveData causes a ~75x slowdown for non-section data, and we only use LiveData for sections anyway
    json_data = ({"LiveData": "Y"} if is_sections else {}) | {"ParentID": f"{parent_unit}"}
    result = client.post(f"{Settings.base_url}/hierarchy{level_endpoint}", json=json_data)
    result_json = result.json()

    # Handle unauthorised access
    if result_json == {"Message": "Authorization has been denied for this request."}:
        raise ci.CompassPermissionError(f"You do not have permission for unit ID:{parent_unit}! E:{level} S:{is_sections}")

    result_units = []
    for unit_dict in result_json:
        parsed = {
            "unit_id": int(unit_dict["Value"]),
            "name": unit_dict["Description"].strip(),
        }
        if unit_dict["Tag"]:
            tag = json.loads(unit_dict["Tag"])[0]
            # Only include section_type if there is section type data
            if "SectionTypeDesc" in tag or "SectionTypeDesc1" in tag:
                section_type = tag.get("SectionTypeDesc") or tag.get("SectionTypeDesc1") or "MISSING"
                parsed["section_type"] = section_type_map.get(section_type, section_type)

        result_units.append(model_class(**parsed))
    return result_units


def get_members_with_roles_in_unit(
    client: Client, unit_number: int, include_name: bool = False, include_primary_role: bool = False
) -> list[ci.HierarchyMember]:
    """Get details of members with roles in a given unit.

    Keys within the member_data JSON are (as at 13/01/220):
     - contact_number (membership number)
     - name (member's name)
     - visibility_status (this is meaningless as we can only see Y people)
     - address (this doesn't reliably give us postcode and is a lot of data)
     - role (This is Primary role and so only sometimes useful)

    Args:
        client: HTTP client
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

    Raises:
        CompassNetworkError:
            For errors while executing the HTTP call
        CompassError:
            If Compass reports that the search was invalid

    """
    keys_to_keep = tuple(filter(None, ("contact_number", "name" * include_name, "role" * include_primary_role)))
    # Construct request data

    # It seems like the time UID value can be constant -- keeping old code in case something breaks
    # dt = datetime.datetime.now()
    # time_uid = f"{dt.hour}{dt.minute}{dt.microsecond // 1000}"
    time_uid = str(12_34_567)
    data = {"SearchType": "HIERARCHY", "OrganisationNumber": unit_number, "UI": time_uid}

    # Execute search
    # JSON data MUST be in the rather odd format of {"Key": key, "Value": value} for each (key, value) pair
    client.post(f"{Settings.base_url}/Search/Members", json=compass_restify(data))

    # Fetch results from Compass
    search_results = client.get(f"{Settings.base_url}/SearchResults.aspx")

    # Gets the compass form from the returned document
    form = html.fromstring(search_results.content).forms[0]
    del search_results

    # If the search hasn't worked the form returns an InvalidSearchError
    if form.action == "./ScoutsPortal.aspx?Invalid=SearchError":
        raise ci.CompassError("Invalid Search")

    # Get the encoded JSON data from the HTML
    member_data_string = form.fields["ctl00$plInnerPanel_head$txt_h_Data"] or "[]"
    del form

    # parse the data and return it as a usable Python object (list)
    member_data = json.loads(member_data_string)
    return [ci.HierarchyMember(**{key: member[key] for key in keys_to_keep}) for member in member_data]
