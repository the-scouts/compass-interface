FROM tiangolo/uvicorn-gunicorn:python3.8-slim

RUN python -m pip install --upgrade pip

COPY requirements.txt /tmp/requirements.txt
RUN cat /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt

# App Module for Gunicorn, pattern module_fqn:variable_name
ENV APP_MODULE="compass.api.app:app"

# This must be the same as GUNICORN_CONF env variable
COPY ./compass/api/gunicorn_conf.py /gunicorn_conf.py

# Custom start script
COPY ./compass/api/startup.sh /start.sh
RUN chmod +x /start.sh

# Docker compose file mounts compass directory to /app/compass
#COPY ./certificates /app/certificates
COPY ./script.py /app/script.py
#COPY ./compass /app/compass

ENV PYTHONPATH=/app/compass:/app:$PYTHONPATH
WORKDIR /app
