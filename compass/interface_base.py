import requests


from compass.settings import Settings


class CompassInterfaceBase:
    def __init__(self, session: requests.Session):
        self.s: requests.Session = session

    def get(self, url, **kwargs) -> requests.Response:
        Settings.total_requests += 1
        return self.s.get(url, **kwargs)

    def post(self, url, **kwargs):
        Settings.total_requests += 1
        data = kwargs.pop("data", None)
        json_ = kwargs.pop("json", None)
        return self.s.post(url, data=data, json=json_, **kwargs)

    def head(self, url, **kwargs):
        Settings.total_requests += 1
        return self.s.head(url, **kwargs)

    def update_headers(self, headers: dict) -> None:
        self.s.headers.update(headers)
