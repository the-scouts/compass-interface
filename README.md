# compass-interface
Interface to Compass

## Installing dependencies

You can install the dependencies through either `pip` or `conda`.

```
# conda
conda env create -n compass-interface
conda activate compass-interface
conda env update 
```

If installing dependencies from  PyPI, please *strongly* consider
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