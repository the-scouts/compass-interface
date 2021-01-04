# Compass Interface - Core

## Release Process

1. Ensure you have the repo forked locally

2. Tag the release (update setup.cfg if necessary)

```shell
git commit --allow-empty -m "🔖 RLS: vX.Y.Z"
git tag -a "vX.Y.Z" -m "Version X.Y.Z"
```

3. Build the release

```shell
conda update -y conda
conda env update
conda activate compass-interface-core
rm -rf dist
#git clean -xdf
#python -m pep517.build .  # Other PEP517 builders?
#python -m build --sdist --wheel --outdir dist/ # Other PEP517 builders?
python -m setup sdist bdist_wheel --universal
```

4. If happy, push the tag

```shell
git push origin master --follow-tags
```

5. Review the created release at [the-scouts/compass-interface-core/releases](https://github.com/the-scouts/compass-interface-core/releases), and publish it

Make sure to check the sdist in `compass/dist/` as the 'binary', as this is used by conda-forge.

6. Update conda-forge feedstock

TODO!

7. Check the upload to PyPI was successful

[comment]: <> (```shell)
[comment]: <> (twine upload compass/dist/compass-interface-core-*.{whl,tar.gz} --skip-existing)
[comment]: <> (```)
