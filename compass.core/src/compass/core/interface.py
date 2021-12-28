from __future__ import annotations

from compass.core.hierarchy import Hierarchy
from compass.core.logon import Logon
from compass.core.people import People
from compass.core.reports import Reports


class CompassInterface:
    def __init__(self, user_props: Logon, /):
        """This is the main (programmatic) interface to CI core."""
        self.user = user_props
        self.people = People(user_props)
        self.hierarchy = Hierarchy(user_props)
        self.reports = Reports(user_props)


# exported as ci.login
def login(username: str, password: str, /, *, role: str | None = None, location: str | None = None) -> CompassInterface:
    """Log in to compass, return a CompassInterface object.

    This function is provided as a convenient interface to the logon module.
    """
    return CompassInterface(Logon.from_logon((username, password), role, location))
