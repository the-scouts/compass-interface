from typing import Literal, Optional, TypedDict, Union

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
TYPES_SECTION = Literal[
    "EY Pilot",
    "Beavers",
    "Cubs",
    "Scouts",
    "Explorers",
    "Network",
    "ASU",
    "Other",
]
TYPES_UNIT_LEVELS = Literal["Group", "District", "County", "Region", "Country", "Organisation"]
TYPES_SECTION_LEVELS = Literal[
    "Group Section",
    "District Section",
    "County Section",
    "Regional Section",
    "Country Section",
    "Organisation Section",
]
TYPES_HIERARCHY_LEVELS = Union[TYPES_UNIT_LEVELS, TYPES_SECTION_LEVELS]
_TYPES_LEVEL = tuple[Optional[TYPES_UNIT_LEVELS], Optional[TYPES_ENDPOINT_LEVELS], TYPES_ENDPOINT_LEVELS]


class _HierarchyState(TypedDict, total=False):
    unit_id: int
    name: Optional[str]
    # organisation: int  # Always 10000001; mildly redundant
    country: int
    region: int
    county: int
    district: int
    group: int
