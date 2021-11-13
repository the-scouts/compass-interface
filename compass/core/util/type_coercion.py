import datetime
from typing import Any, Optional

months_lookup = {
    "january": 1,
    "jan": 1,
    "february": 2,
    "feb": 2,
    "march": 3,
    "mar": 3,
    "april": 4,
    "apr": 4,
    "may": 5,
    "june": 6,
    "jun": 6,
    "july": 7,
    "jul": 7,
    "august": 8,
    "aug": 8,
    "september": 9,
    "sep": 9,
    "october": 10,
    "oct": 10,
    "november": 11,
    "nov": 11,
    "december": 12,
    "dec": 12,
}


def maybe_int(value: Any) -> Optional[int]:
    """Casts value to int or None."""
    try:
        return int(value)
    except ValueError:
        return None


def parse_date(value: str) -> Optional[datetime.date]:
    """Custom date parsing function.

    datetime.datetime.strptime works, this is 10x quicker

    Two date formats:
     - %d %B %Y  e.g. 01 January 2000
     - %d %b %Y  e.g. 01 Jan 2000

     Args:
         value: date string to parse

    Returns:
        Parsed date object

    Raises:
        ValueError: If given string is not in a recognised date format

    """
    if not value:
        return None
    try:
        day, month, year = value.split(" ", 2)
        return datetime.date(int(year), months_lookup[month.lower()], int(day))
    except (KeyError, ValueError) as err:
        raise ValueError(f"Parsing string `{value}` into a date failed!") from err
