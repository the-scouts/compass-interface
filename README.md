# Compass Interface — the unofficial Compass API
[![License](https://img.shields.io/pypi/l/compass-interface-core.svg)](https://github.com/the-scouts/compass-interface-core/blob/master/LICENSE)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

The ***Compass Interface*** project aims to provide a unified and 
well-documented API to the Scouts' national membership system, 
*[Compass](https://compass.scouts.org.uk)*.

## Notice

This is ***not*** an official API to Compass and as such should be used in a 
way that doesn't cause a high request load on the Compass system.

Please also remember your personal data handling obligations (under both GDPR 
and Scouting policies) whilst using this system.

## Objectives

The project aims to: 
 - increase flexibility and simplicity when developing applications that 
   interface with *Compass* data, 
 - provide  stability and abstract complexities of *Compass*, and 
 - enable greater support to our adult  volunteers and members.

## Where to get it

The source code for the project is hosted on GitHub at 
[the-scouts/compass-interface](https://github.com/the-scouts/compass-interface)

The project can be installed through either `pip` or `conda`.

```shell
# conda
conda env create
conda activate compass-interface
```

If installing dependencies from  PyPI, please **strongly** consider
[using a virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment)
to isolate your packages. 

```shell
# or PyPI
pip install -r requirements.txt 
```

### Dependencies

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

#### Dev-dependencies

We use `black`, `isort`, `ipython` and others to speed up the development 
process!

## Licence

***Compass Interface*** is naturally 
[open source](https://github.com/the-scouts/compass-interface) and is 
licensed under the **[MIT license](https://choosealicense.com/licenses/mit/)**.

## Usage

### Running the API

To run the API either run `uvicorn compass.api.app:app --reload` in the
root directory, or run the app.py file in the `/compass/api/` directory. This
second method also enables interactive debugging.

Alternativley, use [Docker](#Docker)

### Running the Compass Interface files directly

To run the Compass Interface files directly the top-level script.py file
is useful for getting started immediately. Please make sure not to commit
credentials to git, as these are assumed public as soon as they are on 
GitHub.

### Docker
To start docker compose, run `docker-compose up -d`.  
To stop docker, run `docker-compose down`.  
To rebuild the app, run `docker-compose build --no-cache backend`.  
To access an interative shell, run `docker run -it backend bash`.

When the containers are running, Redis Insight is available at
[localhost:8001](http://localhost:8001), the FastAPI app is reached at
[localhost:8888](http://localhost:8888), and the Traefik reverse proxy is
[localhost:80](http://localhost:80) for the app proxy and
[localhost:8080](http://localhost:8080) for Traefik's dashboard.

## Support

For support please contact Adam Turner (@AA-Turner). There is a wider
community of interest on the `UK Scouts IT Lab` group.

### Ideas, Bugs, Features

Please use GitHub issues / Pull Requests to note bugs or feature requests.
