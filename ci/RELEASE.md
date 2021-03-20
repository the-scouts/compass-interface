# Compass Interface - Core

## Release Process

1. Update setup.cfg `metadata.version`

2. Tag the release (update setup.cfg if necessary)

```shell
git commit -m "🔖 RLS: vX.Y.Z"
git tag -a "vX.Y.Z"
```

3. If happy, push the tag

```shell
git push origin master --follow-tags
```

4. GitHub Actions will build the artifacts and  automatically release to PyPI

5. Review the created release at 
   [the-scouts/compass-interface-core/releases](https://github.com/the-scouts/compass-interface-core/releases), 
   and publish it

6. Conda forge's automation will build the release for conda ~2 hours after 
   publication on GitHub releases
   
6. Check the upload to PyPI, GitHub Releases, and Conda were successful
