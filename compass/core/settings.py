from pathlib import Path
from typing import Optional

import pydantic


class _SettingsModel(pydantic.BaseSettings):
    base_domain: str = "compass.scouts.org.uk"
    base_url: pydantic.HttpUrl = f"https://{base_domain}"  # type: ignore[assignment]
    date_format: str = "%d %B %Y"  # dd Month YYYY
    org_number: int = 10000001
    total_requests: int = 0
    wcf_json_endpoint: str = "/JSon.svc"  # Windows communication foundation JSON service endpoint
    web_service_path: pydantic.HttpUrl = base_url + wcf_json_endpoint  # type: ignore[assignment]
    debug: bool = False
    validation_errors: bool = True
    log_file: Optional[Path] = None

    class Config:
        case_sensitive = False  # this is the default, but mark for clarity.
        env_prefix = "CI_"  # env variables named `REDIS_HOST` etc


Settings = _SettingsModel()
