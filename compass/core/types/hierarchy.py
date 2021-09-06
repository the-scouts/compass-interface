from typing import Literal, Union

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
