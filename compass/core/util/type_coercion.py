import datetime
from typing import Any, Optional


def maybe_int(value: Any) -> Optional[int]:
    """Casts value to int or None."""
    try:
        return int(value)
    except ValueError:
        return None


def parse(date_time_str: str) -> Optional[datetime.date]:
    if not date_time_str:
        return None
    try:
        return datetime.datetime.strptime(date_time_str, "%d %B %Y").date()  # e.g. 01 January 2000
    except ValueError:
        return datetime.datetime.strptime(date_time_str, "%d %b %Y").date()  # e.g. 01 Jan 2000
