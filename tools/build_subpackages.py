from pathlib import Path
import shutil
import sys
import tarfile
import tempfile
from traceback import TracebackException
from typing import Literal

import build
import build.env

PROJECT_ROOT = Path(__file__).parent.parent
OUT_DIR = (PROJECT_ROOT / "dist").as_posix()

# skip messing with logging.config etc
build.ProjectBuilder.log = build.env.IsolatedEnvBuilder.log = lambda _self, message: print(f"* {message}")


# enables passing Path objects
class ProjectBuilder(build.ProjectBuilder):
    def __init__(self, src_dir: Path):
        super().__init__(src_dir.as_posix())


def build_current(builder: build.ProjectBuilder, distribution: Literal["sdist", "wheel"]) -> Path:
    return Path(builder.build(distribution, OUT_DIR))


def build_isolated(builder: build.ProjectBuilder, distribution: Literal["sdist", "wheel"]) -> Path:
    with build.env.IsolatedEnvBuilder() as env:
        builder.python_executable = env.executable
        builder.scripts_dir = env.scripts_dir
        env.install(builder.build_system_requires)  # install build dependencies
        env.install(builder.get_requires_for_build(distribution))  # get extra required dependencies from the backend
        return Path(builder.build(distribution, OUT_DIR))


# cut down version of build.__main__.main
def do_build(package_dir: Path) -> None:
    try:
        sdist = build_isolated(ProjectBuilder(package_dir), "sdist")
        sdist_out = Path(tempfile.mkdtemp(prefix="build-via-sdist-"))
        try:
            with tarfile.TarFile.gzopen(sdist) as tf:
                tf.extractall(sdist_out)
            print("* Building wheel from sdist")
            wheel = build_isolated(ProjectBuilder(sdist_out / sdist.name.removesuffix(".tar.gz")), "wheel")
        finally:
            shutil.rmtree(sdist_out, ignore_errors=True)
    except Exception as err:
        print("\n" + "".join(TracebackException.from_exception(err).format()))
        raise SystemExit(f"ERROR {err}")
    print(f"Successfully built {sdist.name} and {wheel.name}")


if __name__ == "__main__":
    for package_name in sys.argv[1:]:
        print(f"\nBuilding {package_name}")
        do_build(PROJECT_ROOT / package_name)
