import pydantic


class _SettingsModel(pydantic.BaseSettings):
    base_domain: str = "compass.scouts.org.uk"
    base_url: pydantic.HttpUrl = f"https://{base_domain}"
    date_format: str = "%d %B %Y"  # dd Month YYYY
    org_number: int = 10000001
    total_requests: int = 0
    wcf_json_endpoint: str = "/JSon.svc"  # Windows communication foundation JSON service endpoint
    web_service_path: pydantic.HttpUrl = base_url + wcf_json_endpoint
    debug: bool = False

    class Config:  # noqa: D106
        case_sensitive = False  # this is the default, but mark for clarity.
        env_prefix = "CI_"  # env variables named `REDIS_HOST` etc


Settings = _SettingsModel()
