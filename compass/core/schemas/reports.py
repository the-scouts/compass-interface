from typing import Iterable, Literal

TYPES_REPORTS = Literal[
    "Appointments Report",
    "Member Directory Report",
    "18-25 Member Directory Report",
    "Permits Report",
    "Disclosure Report",
    "Training Report",
    "Awards Report",
    "Disclosure Management Report",
]
TYPES_FORMAT_CODE = Literal["CSV", "EXCEL", "XML"]
TYPES_FORMAT_CODES = Iterable[TYPES_FORMAT_CODE]
TYPES_EXPORTED_REPORTS = dict[TYPES_FORMAT_CODE, bytes]
