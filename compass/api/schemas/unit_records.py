from typing import NamedTuple, Union

import pydantic


class UnitRecord(NamedTuple):
    """Storage format for Units."""

    name: str
    parent: int
    children: Union[dict[int, str], None]
    sections: Union[dict[int, str], None]


class UnitRecordModel(pydantic.BaseModel):
    """Serialised format. Keep identical to NullableUnitRecord."""

    name: str
    parent: int
    children: Union[dict[int, str], None]
    sections: Union[dict[int, str], None]
