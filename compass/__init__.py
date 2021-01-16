# This directory is a Python package.
import compass.logon


def logon(username: str, password: str, compass_role: str = None) -> compass.logon.Logon:
    """Log in to compass, return a compass.logon.Logon object

    This function is provided as a convenient interface to the logon module.
    """
    return compass.logon.Logon((username, password), compass_role)
