class CompassError(Exception):
    pass


class CompassAuthenticationError(CompassError):
    pass


class CompassPermissionError(CompassError):
    pass


class CompassReportError(CompassError):
    pass


class CompassReportPermissionError(CompassReportError, CompassPermissionError):
    pass
