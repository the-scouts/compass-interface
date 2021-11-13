from pathlib import Path

Path(__file__, "..", "version.txt").resolve().write_text(
    # read version file
    Path(__file__, "..", "..", "compass", "core", "__version__.py").resolve().read_text(encoding="utf-8")
    # get first line
    .split("\n")[0]
    # remove lead and tail
    .removeprefix('__version__ = "').removesuffix('"'),
    encoding="utf-8",
)
