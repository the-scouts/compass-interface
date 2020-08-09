FROM tiangolo/uvicorn-gunicorn:python3.8-slim

RUN python -m pip install --upgrade pip

COPY requirements.txt /tmp/requirements.txt
RUN cat /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt

# App Module for Gunicorn, pattern module_fqn:variable_name
ENV APP_MODULE="src.api.app:app"

# This must be the same as GUNICORN_CONF env variable
COPY ./src/api/gunicorn_conf.py /gunicorn_conf.py

# Custom start script
COPY ./src/api/startup.sh /start.sh
RUN chmod +x /start.sh

# Docker compose file mounts src directory to /app/src
COPY ./certificates /app/certificates
COPY ./script.py /app/script.py
#COPY ./src /app/src

ENV PYTHONPATH=/app/src:/app:$PYTHONPATH
WORKDIR /app
