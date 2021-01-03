import toml
import pathlib
import pep517.wrappers


def main():
    # Folder containing 'pyproject.toml'
    ROOT_DIR = pathlib.Path(__file__).parent
    build_sys = toml.load(ROOT_DIR / "pyproject.toml")['build-system']

    print(build_sys['requires'])  # List of static requirements
    # The caller is responsible for installing these and running the hooks in
    # an environment where they are available.

    hooks = pep517.wrappers.Pep517HookCaller(
        ROOT_DIR,
        build_backend=build_sys['build-backend'],
        backend_path=build_sys.get('backend-path'),
    )

    config_options = {}   # Optional parameters for backend
    # List of dynamic requirements:
    print(hooks.get_requires_for_build_wheel(config_options))
    # Again, the caller is responsible for installing these build requirements

    destination = ROOT_DIR / "dist"
    whl_filename = hooks.build_wheel(destination, config_options)
    assert destination.joinpath(whl_filename).is_file()
    sdist_filename = hooks.build_sdist(destination, config_options)
    assert destination.joinpath(sdist_filename).is_file()


if __name__ == '__main__':
    main()
