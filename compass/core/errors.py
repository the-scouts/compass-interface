class CompassError(Exception):
    pass


class CompassAuthenticationError(CompassError):
    pass


class CompassReportError(CompassError):
    pass


class CompassReportPermissionError(PermissionError, CompassError):
    pass
