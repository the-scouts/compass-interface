# This directory is a Python package.
from compass.errors import CompassAuthenticationError
from compass.errors import CompassError
import compass.hierarchy
import compass.logon
import compass.people
import compass.reports
import compass.schemas.hierarchy  # TODO what schemas are should/need to be public?
import compass.schemas.member  # TODO what schemas are should/need to be public?
import compass.settings
import compass.utility


def logon(username: str, password: str, compass_role: str = None) -> compass.logon.Logon:
    """Log in to compass, return a compass.logon.Logon object

    This function is provided as a convenient interface to the logon module.
    """
    return compass.logon.Logon((username, password), compass_role)
