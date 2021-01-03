# Compass Interface - Core

## Release Process

1. Ensure you have the repo forked locally

2. Tag the release

```shell
git checkout master
git pull --ff-only origin master
git clean -xdf
git commit --allow-empty -m "🔖 RLS: vX.Y.Z"
git tag -a "vX.Y.Z" -m "Version vX.Y.Z"
```

3. Build the release

```shell
conda update -y conda
conda env update
conda activate compass-interface-core
rm -rf dist
git clean -xdf
#python -m pep517.build .  # Other PEP517 builders?
python -m setup sdist bdist_wheel --universal
```

4. If happy, push the tag

```shell
git push origin master --follow-tags
```

5. Manually create a release at [the-scouts/compass-interface-core/releases](https://github.com/the-scouts/compass-interface-core/releases)

Make sure to upload the sdist in `compass/dist/` as the 'binary', as this is used by conda-forge.

6. Update conda-forge feedstock

TODO!

7. Upload to PyPi

```shell
twine upload compass/dist/compass-interface-core-*.{whl,tar.gz} --skip-existing
```

### Deprecated

```python
import os, sys, shutil, pathlib

here = pathlib.Path(__file__).parent
VERSION = "vX.Y.Z"

def status(s):
    """Prints things in bold."""
    print(f'\033[1m{s}\033[0m')

status('Removing previous builds…')
try:
    shutil.rmtree(here.joinpath("dist"))
except OSError:
    pass

status('Building Source and Wheel (universal) distribution…')
os.system(f'{sys.executable} setup.py sdist bdist_wheel --universal')

status('Uploading the package to PyPI via Twine…')
os.system('twine upload dist/*')

status('Pushing git tags…')
os.system(f'git tag v{VERSION}')
os.system('git push --tags')

sys.exit()
```

