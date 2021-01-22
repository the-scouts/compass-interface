# This directory is a Python package.
from typing import Optional

from compass.errors import CompassAuthenticationError
from compass.errors import CompassError
import compass.hierarchy
from compass.hierarchy import Hierarchy
import compass.logging
from compass.logon import Logon
import compass.people
from compass.people import People
import compass.reports
import compass.schemas.hierarchy  # TODO what schemas are should/need to be public?
import compass.schemas.member  # TODO what schemas are should/need to be public?
import compass.settings
import compass.utility


def logon(username: str, password: str, compass_role: Optional[str] = None) -> Logon:
    """Log in to compass, return a compass.logon.Logon object.

    This function is provided as a convenient interface to the logon module.
    """
    return Logon((username, password), compass_role)
