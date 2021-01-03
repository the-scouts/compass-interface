# Compass Interface - Core
[![PyPI Latest Release](https://img.shields.io/pypi/v/compass-interface-core.svg)](https://pypi.org/project/compass-interface-core/)
[![Conda Latest Release](https://anaconda.org/conda-forge/compass-interface-core/badges/version.svg)](https://anaconda.org/conda-forge/compass-interface-core/)
[![License](https://img.shields.io/pypi/l/compass-interface-core.svg)](https://github.com/the-scouts/compass-interface-core/blob/master/LICENSE)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

The ***Compass Interface*** project aims to provide a unified and well-documented API to 
the Scouts' national membership system, *[Compass](https://compass.scouts.org.uk)*. 

## Notice

This is ***not*** an official API to Compass and as such should be used in a way that doesn't cause a high request load on the Compass system.

Please also remember your personal data handling obligations (under both GDPR and Scouting policies) whilst using this module.

## Where to get it

The source code for the project is hosted on GitHub at [the-scouts/compass-interface-core](https://github.com/the-scouts/compass-interface-core)

Installers for the latest release are availibe on [Conda](https://anaconda.org/conda-forge/compass-interface-core/) and at the 
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
- [certifi](https://github.com/certifi/python-certifi) - for SSL/TLS certificate management
- [lxml](https://lxml.de/) - for parsing HTML documents
- [python-dateutil](https://github.com/dateutil/dateutil/lxm) - for parsing date strings
- [pandas](https://github.com/pandas-dev/pandas) - for data management and transformation

## License

***Compass Interface - Core*** is naturally [open source](https://github.com/the-scouts/compass-interface-core) 
and is licensed under the **[MIT license](https://choosealicense.com/licenses/mit/)**.

## Core Module

This sub-project hosts the extraction functionaility of Compass Interface, and is itself a standalone module for querying Compass.

The main project is found at [the-scouts/compass-interface](https://github.com/the-scouts/compass-interface).

## Example Usage

TBC
