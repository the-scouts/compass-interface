from pathlib import Path
from typing import Optional

import pydantic


class _SettingsModel(pydantic.BaseSettings):
    # Network
    base_domain: str = "compass.scouts.org.uk"
    wcf_json_endpoint: str = "/JSon.svc"  # Windows communication foundation JSON service endpoint
    base_url: pydantic.HttpUrl = f"https://{base_domain}"  # type: ignore[assignment]
    web_service_path: pydantic.HttpUrl = base_url + wcf_json_endpoint  # type: ignore[assignment]
    # Requests
    total_requests: int = 0
    # Application
    org_number: int = 10000001
    date_format: str = "%d %B %Y"  # dd Month YYYY
    # Environment
    debug: bool = False
    log_file: Optional[Path] = None
    use_cache: bool = False
    validation_errors: bool = True

    class Config:
        case_sensitive = False  # this is the default, but mark for clarity.
        env_prefix = "CI_"  # env variables named `REDIS_HOST` etc


Settings = _SettingsModel()
