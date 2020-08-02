# compass-interface
Interface to Compass

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