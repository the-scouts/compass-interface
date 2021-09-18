FROM quay.io/condaforge/miniforge3
# https://github.com/conda-forge/miniforge-images/blob/master/ubuntu/Dockerfile

# use bash not sh
SHELL ["/bin/bash", "-c"]

# prevent Python from recreating bytecode *.pyc files
ENV PYTHONDONTWRITEBYTECODE=true

# copy gunicorn config file (this should change very rarely)
COPY $GUNICORN_CONF "/home/compass-inferface/$GUNICORN_CONF"

ENV APP_MODULE="compass.api.app:app"
ENV GUNICORN_CONF="gunicorn_conf.py"
ENV WORKER_CLASS="uvicorn.workers.UvicornWorker"

# Because it is surprisingly difficult to activate a conda environment inside a DockerFile
# (from personal experience and per https://github.com/ContinuumIO/docker-images/issues/89),
# we just update the base/root one from the 'environment.yml' file instead of creating a new one.
#
# Set up environment
RUN conda install --yes python~=3.9 compass-interface gunicorn uvicorn \
    && conda clean --all --force-pkgs-dirs --yes \
    && find /opt/conda/ -follow -type f -name '*.a' -delete \
    && find /opt/conda/ -follow -type f -name '*.pyc' -delete \
    && find /opt/conda/ -follow -type f -name '*.js.map' -delete

CMD gunicorn -k "$WORKER_CLASS" -c "/home/compass-inferface/$GUNICORN_CONF" "$APP_MODULE"
