"""Finalise the repo for a release."""

import pathlib
import subprocess

import bumper

PROJECT_ROOT = pathlib.Path(__file__).parent.parent
RELEASE_FILE = PROJECT_ROOT / "RELEASE.rst"
HISTORY_FILE = PROJECT_ROOT / "HISTORY.rst"


def release_kind():
    """Determine which release to make based on the files in the changelog."""
    with open(RELEASE_FILE, encoding="utf-8") as f:
        kind = f.readline().rstrip().removeprefix("RELEASE_TYPE:").strip()
    if kind not in {"major", "minor", "patch"}:
        raise ValueError(f"The first line of {RELEASE_FILE} must be RELEASE_TYPE: followed by one of major, minor, or patch.")
    return kind


def update_changelog(version):
    lines = HISTORY_FILE.read_text(encoding="utf-8").splitlines()
    heading = f"Version {version}"
    new_changelog_lines = (
        *lines[:3],
        heading,
        "-" * len(heading),
        "",
        "\n".join(RELEASE_FILE.read_text(encoding="utf-8").split("\n")[1:]).strip(),
        "",
        *lines[3:],
        ""
    )
    HISTORY_FILE.write_text("\n".join(new_changelog_lines), encoding="utf-8")


def commit(version):
    """Create a commit with the new release."""
    subprocess.check_call(["git", "rm", RELEASE_FILE])
    subprocess.check_output(["git", "add", "--update", ":/"])  # all tracked files with changes
    subprocess.check_output(["git", "commit", "--message", f"\N{BOOKMARK} RLS: v{version}"])


def tag(version):
    assert f"v{version}" not in {*subprocess.check_output(["git", "tag"], encoding="utf-8").split("\n")}
    subprocess.check_output(["git", "tag", "-m", f"\N{BOOKMARK} RLS: v{version}", f"v{version}"])


def push_with_tags(version):
    subprocess.check_call(["git", "push", "origin", f"v{version}"])
    subprocess.check_call(["git", "push", "origin", "HEAD:master"])


if __name__ == "__main__":
    # python tools/prepare_release.py <kind>
    if not RELEASE_FILE.exists():
        print("RELEASE.rst file not found!")
        raise SystemExit(2)

    print("Configuring git")
    subprocess.check_call(["git", "config", "user.name", "Adam Turner"])
    subprocess.check_call(["git", "config", "user.email", "9087854+AA-Turner@users.noreply.github.com"])

    release_type = release_kind()
    new_version = bumper.get_new_version(release_type)
    print(f"Creating release for version {new_version}")
    bumper.bump_version(release_type)

    print("Updating changelog")
    update_changelog(new_version)

    print("Committing changes")
    commit(new_version)

    print(f"Creating tag")
    tag(new_version)

    print(f"Pushing changes")
    push_with_tags(new_version)

    raise SystemExit(0)
