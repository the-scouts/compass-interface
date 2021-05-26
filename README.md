# Compass Interface - Core
![PyPI - Python Version](https://img.shields.io/pypi/pyversions/compass-interface-core)
![PyPI - Status](https://img.shields.io/pypi/status/compass-interface-core)
[![PyPI Latest Release](https://img.shields.io/pypi/v/compass-interface-core.svg)](https://pypi.org/project/compass-interface-core/)
[![Conda Latest Release](https://anaconda.org/conda-forge/compass-interface-core/badges/version.svg)](https://anaconda.org/conda-forge/compass-interface-core/)
[![License](https://img.shields.io/pypi/l/compass-interface-core.svg)](https://github.com/the-scouts/compass-interface-core/blob/master/LICENSE)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

The ***Compass Interface*** project aims to provide a unified and well-documented API to 
the Scouts' national membership system, *[Compass](https://compass.scouts.org.uk)*. 

## Notice

This is ***not*** an official API to Compass and as such should be used in a 
way that doesn't cause a high request load on the Compass system.

Please also remember your personal data handling obligations (under both GDPR 
and Scouting policies) whilst using this module.

## Where to get it

The source code for the project is hosted on GitHub at 
[the-scouts/compass-interface-core](https://github.com/the-scouts/compass-interface-core)

Installers for the latest release are availibe on 
[Conda](https://anaconda.org/conda-forge/compass-interface-core/) and at the 
[Python Package Index (PyPI)](https://pypi.org/project/compass-interface-core/).

```sh
# conda
conda install compass-interface-core
```

```sh
# or PyPI
pip install compass-interface-core
```

## Dependencies

- [requests](https://github.com/psf/requests) - for intuitive HTTP requests
- [lxml](https://lxml.de/) - for parsing HTML documents
- [pydantic](https://github.com/samuelcolvin/pydantic/), 
  [email-validator](https://github.com/JoshData/python-email-validator), 
  [phonenumbers](https://github.com/daviddrysdale/python-phonenumbers) - for 
  data validation and parsing

## License

***Compass Interface - Core*** is naturally 
[open source](https://github.com/the-scouts/compass-interface-core) and is 
licensed under the **[MIT license](https://choosealicense.com/licenses/mit/)**.

## Core Module

This sub-project hosts the extraction functionaility of Compass Interface, 
and is itself a standalone module for querying Compass.

The main project is found at 
[the-scouts/compass-interface](https://github.com/the-scouts/compass-interface).

## Example Usage

```python
import compass.core as ci

# Turn on debug logging for development
ci.logger.enable_debug_logging()

# Login to Compass
api = ci.login("username", "password")

# Get all unique members from your hierarchy
member_set = api.hierarchy.unique_members()
```

### Specifying a role

By default, *Compass Interface* uses your primary role to access Compass. To 
change this, a custom role can be specified when calling `ci.login`, as 
follows:

```python
import compass.core as ci

# Turn on debug logging for development
ci.logger.enable_debug_logging()

# Login to Compass
api = ci.login("username", "password", role="role_as_on_compass")
```

The string passed to the `role` argument must match the role title on Compass
exactly, as they are compared internally. You can validate that the role has
updated successfully through the log output.

### Specifying a role and location

If you have multiple roles with the same title on compass (for example, two
`Group Administrator` or `Scout Active Support Manager` roles), these can be
differentiated by also specifying a role location, as follows:

```python
import compass.core as ci

# Turn on debug logging for development
ci.logger.enable_debug_logging()

# Login to Compass
api = ci.login("username", "password", role="role_as_on_compass", location="location_as_on_compass")
```

As with the role title, the location needs to match the text in the `Location` 
column of `My Roles` exactly, as we verify the text matches internally.
