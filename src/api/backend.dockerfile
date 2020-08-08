FROM debian:buster-slim
#FROM buildpack-deps:buster
# Debian Buster is version 10, https://wiki.debian.org/DebianReleases#Production_Releases

# backend.dockerfile, parts from:
# https://github.com/ContinuumIO/docker-images/blob/master/miniconda3/debian/Dockerfile
# https://github.com/tiangolo/python-machine-learning-docker/blob/master/python3.6/Dockerfile

# Tini included in Docker 1.13 + with --init flag to docker run

SHELL ["/bin/bash", "-c"]

# Explicit install of Python 3.7 with:
# "/opt/conda/bin/conda install -y python=$PYTHON_VERSION"
ENV PYTHON_VERSION=3.8

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
ENV PATH /opt/conda/bin:$PATH

# Is the second install line needed? Should we also get cURL?
RUN apt-get update --fix-missing && \
    apt-get install -y wget bzip2 ca-certificates git && \
    apt-get clean
#                  && \
#    rm -rf /var/lib/apt/lists/*

# Begin Conda
RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    /opt/conda/bin/conda install -y python=$PYTHON_VERSION && \
    /opt/conda/bin/conda clean -tipsy && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc && \
    find /opt/conda/ -follow -type f -name '*.a' -delete && \
    find /opt/conda/ -follow -type f -name '*.js.map' -delete && \
    /opt/conda/bin/conda clean -afy
# End Conda
RUN echo "conda version: $(conda --version)"

COPY environment.yml /tmp/environment.yml
RUN cat /tmp/environment.yml
RUN conda env create -f /tmp/environment.yml

# Pull the environment name out of the environment.yml
ENV CONDA_ENV_NAME $(head -1 /tmp/environment.yml | cut -d' ' -f2)
RUN echo "source activate compass-interface" > ~/.bashrc
RUN source activate compass-interface
ENV PATH /opt/conda/envs/compass-interface/bin:$PATH

# App Module for Gunicorn, pattern module_fqn:variable_name
ENV app_module="src.api.app:app"
ENV worker_class="uvicorn.workers.UvicornWorker"

# These two must be aligned
ENV gunicorn_conf_file="/app/gunicorn_conf.py"
COPY ./src/api/gunicorn_conf.py /app/gunicorn_conf.py

COPY ./src/api/startup.sh /startup.sh
RUN chmod +x /startup.sh
RUN echo $(ls)

#COPY ./src /app/src
# Only needed currently, TODO remove
COPY ./script.py /app/script.py
COPY ./certificates /app/certificates

WORKDIR /app
ENV SECRET_KEY="secret"
ENV PYTHONPATH=/app/src:/app:$PYTHONPATH
EXPOSE 80

CMD ["/startup.sh"]

