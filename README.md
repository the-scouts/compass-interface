# Compass Interface — the unofficial Compass API
![Python Versions](https://img.shields.io/pypi/pyversions/compass-interface.svg)
![Status](https://img.shields.io/pypi/status/compass-interface.svg)
[![PyPI Latest Release](https://img.shields.io/pypi/v/compass-interface.svg)](https://pypi.org/project/compass-interface/)
[![Conda Latest Release](https://img.shields.io/conda/vn/conda-forge/compass-interface.svg)](https://anaconda.org/conda-forge/compass-interface)
[![License](https://img.shields.io/pypi/l/compass-interface.svg)](https://github.com/the-scouts/compass-interface/blob/master/LICENSE)
[![Code Style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

The ***Compass Interface*** project aims to provide a unified and
well-documented API to the Scouts' national membership system,
*[Compass](https://compass.scouts.org.uk)*.

## Notice

This is ***not*** an official API to Compass and as such should be used in a
way that doesn't cause a high request load on the Compass system.

Please also remember your personal data handling obligations (under both GDPR
and Scouting policies) whilst using this library.

## Objectives

The project aims to:
- increase flexibility and simplicity when developing applications that
  interface with *Compass* data,
- provide stability and abstract complexities of *Compass*, and
- enable greater support to our adult volunteers and members.

## Where to get it

The source code for the project is hosted on GitHub at
[the-scouts/compass-interface](https://github.com/the-scouts/compass-interface)

Installers for the latest release are availibe on
[Conda](https://anaconda.org/conda-forge/compass-interface/) and at the
[Python Package Index (PyPI)](https://pypi.org/project/compass-interface/).

```sh
# conda
conda env create
conda install compass-interface
```

If installing dependencies with `pip`,
[use a virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment)
to isolate your packages.

```sh
# or PyPI

# create venv
python -m venv venv

# activate venv - windows
.\venv\Scripts\activate
# activate venv - unix-like (macOS, linux)
source env/bin/activate 

# install dependencies
python -m pip install --upgrade pip
python -m pip install compass-interface
```

## Dependencies

- [httpx](https://github.com/encode/httpx) - for intuitive HTTP requests
- [lxml](https://lxml.de/) - for parsing HTML documents
- [pydantic](https://github.com/samuelcolvin/pydantic/),
  [email-validator](https://github.com/JoshData/python-email-validator),
  [phonenumbers](https://github.com/daviddrysdale/python-phonenumbers) - for
  data validation and parsing
- [compass](https://github.com/the-scouts/compass-interface-core) - Core
  Compass Interface, with parsing and validation logic
- [pandas](https://github.com/pandas-dev/pandas) - for data management and
  transformation
- [numba](https://github.com/numba/numba) - to speed things up
- [pyarrow](https://github.com/apache/arrow/tree/master/python) - to process
  and move data fast
- [FastAPI](https://github.com/tiangolo/FastAPI/) - for an intuitive API
- [uvicorn](https://github.com/encode/uvicorn) - serving on the lightning-fast
  ASGI server

## Licence

***Compass Interface*** is naturally
[open source](https://github.com/the-scouts/compass-interface) and is
licensed under the **[MIT license](https://choosealicense.com/licenses/mit/)**.

## Core Module

This sub-project hosts the extraction functionaility of Compass Interface,
and is itself a standalone module for querying Compass.

The main project is found at
[the-scouts/compass-interface](https://github.com/the-scouts/compass-interface).

## Example Usage

```python
import compass.core as ci
from compass.core.logger import enable_debug_logging

# Turn on debug logging for development
enable_debug_logging()

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
from compass.core.logger import enable_debug_logging

# Turn on debug logging for development
enable_debug_logging()

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
from compass.core.logger import enable_debug_logging

# Turn on debug logging for development
enable_debug_logging()

# Login to Compass
api = ci.login("username", "password", role="role_as_on_compass", location="location_as_on_compass")
```

As with the role title, the location needs to match the text in the `Location`
column of `My Roles` exactly, as we verify the text matches internally.

## API Usage

### Running the API

To run the API either run `uvicorn compass.api.app:app --reload` in the
root directory, or run the `app.py` file in the `/compass/api/` directory. This
second method also enables interactive debugging.

Alternatively, use [Docker](#Docker)

### Running the Compass Interface files directly

To run the Compass Interface files directly the top-level script.py file
is useful for getting started immediately. Please make sure not to commit
credentials to git, as these are assumed public as soon as they are on
GitHub.

### Docker
To run Compass Interface locally, we provide docker templates in `/docker`.

```diff
! Note: All commands below are run in the /docker directory.
```

#### Local hosting / development

To start docker, run `docker compose -f docker-compose.yml up -d`.  
To rebuild the Compass Interface backend, run `docker buildx build -t scouts/compass-interface-backend --load -f backend.dockerfile .`.  
To stop docker, run `docker compose down`.  
To remove old build files, run `docker container prune -f; docker image prune -f`

#### Deployment

To start docker, run
`docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`.  
To stop docker, run `docker-compose down`.

#### Ports

When the containers are running, the FastAPI app is reached at
[localhost:8888](http://localhost:8888).

If you are running the deployment configuration, you will also find the Traefik
reverse proxy at [localhost:80](http://localhost:80) and Traefik's dashboard at
[localhost:8080](http://localhost:8080).

## Support

For support please contact Adam Turner (@AA-Turner). There is a wider
community of interest on the `UK Scouts IT Lab` group.

### Ideas, Bugs, Features

Please use GitHub issues / Pull Requests to note bugs or feature requests.
