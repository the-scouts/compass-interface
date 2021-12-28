from __future__ import annotations

import dataclasses
from pathlib import Path
import re

import tomli

PROJECT_ROOT = Path(__file__).parent.parent
VERSION_PATTERN = re.compile(r"(?P<major>\d+)\.(?P<minor>\d+)\.(?P<micro>\d+)", re.VERBOSE)
CONFIG_DATA = tomli.loads((PROJECT_ROOT / "pyproject.toml").read_text())["tool"]["bumper"]


@dataclasses.dataclass(frozen=True)
class Version:
    major: int
    minor: int
    micro: int

    def __str__(self):
        return f"{self.major}.{self.minor}.{self.micro}"

    def bump_part(self, part: str):
        return Version(**(self.__dict__ | {part: self.__dict__[part] + 1}))


def parse_version(version: str) -> Version:
    try:
        return Version(**{k: int(v) for k, v in VERSION_PATTERN.fullmatch(version).groupdict().items()})
    except (ValueError, AttributeError):
        raise ValueError(f"Could not parse version string {version}. All parts must be integers.") from None


def patch_files(current_version: Version, new_version: Version, files: list[dict[str, str]]) -> None:
    for file in files:
        file_path = PROJECT_ROOT / file["src"]
        print(f"Patching {file_path}")
        old_string = file["template"].format(**current_version.__dict__)
        search = file["search"].format(current_version=old_string)
        lines = file_path.read_text().splitlines(keepends=True)
        for line_number, line in enumerate(lines):
            if old_string in line and search in line:
                lines[line_number] = line.replace(old_string, file["template"].format(**new_version.__dict__))
                file_path.write_text("".join(lines))


def get_new_version(kind: str) -> str:
    return str(parse_version(CONFIG_DATA["current_version"]).bump_part(kind))


def bump_version(kind: str) -> None:
    current = parse_version(CONFIG_DATA["current_version"])
    new = current.bump_part(kind)
    print(f"Bumping from '{current}' to '{new}'")
    patch_files(current, new, CONFIG_DATA["file"])
