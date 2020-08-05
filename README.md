# Compass Interface — the unofficial Compass API
The ***Compass Interface*** project aims to provide a unified and well-documented API to 
the Scouts' national membership system, *[Compass](https://compass.scouts.org.uk)*. 

The project aims to: 
 - increase flexibility and simplicity when developing applications that interface with *Compass* data, 
 - provide  stability and abstract complexities of *Compass*, and 
 - enable greater support to our adult  volunteers and 
members. 

***Compass Interface*** is naturally [open source](https://github.com/the-scouts/compass-interface) 
and is licensed under the **[MIT license](https://choosealicense.com/licenses/mit/)**.

## Installing dependencies

You can install the dependencies through either `pip` or `conda`.

```
# conda
conda env create
conda activate compass-interface
```

If installing dependencies from  PyPI, please **strongly** consider
[using a virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment)
to isolate your packages. 

```
# PyPI
pip install -r requirements.txt 
```



## Running the API

To run the FastAPI API either run `uvicorn src.api.app:app --reload` in the
root directory, or run the app.py file in the `/src/api/` directory. This
second method also enables interactive debugging.

## Running the Compass Interface files directly

To run the Compass Interface files directly the top-level script.py file
is useful for getting started immediately. Please make sure not to commit
credentials to git, as these are assumed public as soon as they are on 
GitHub.

## Support

For support please contact Adam Turner (@AA-Turner). There is a wider
community of interest on the `UK Scouts IT Lab` group.

## Ideas, Bugs, Features

Please use GitHub issues / Pull Requests to note bugs or feature requests.

## Dependencies

Used in getting and parsing data:
- requests
- lxml
- certifi (for certificate management)

Used in transforming and querying data:
- pandas
- numba
- pyarrow

Used in exposing the API:
- FastAPI
- uvicorn

Used in development:
- black
- d-tale
- ipython

## Licence

This project is licensed under the terms of the MIT license.

[tt]: https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment

[]: https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment