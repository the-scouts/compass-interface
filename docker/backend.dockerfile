# Container to build the environment
FROM quay.io/condaforge/mambaforge as mamba
# https://github.com/conda-forge/miniforge-images/blob/master/ubuntu/Dockerfile

# Set up environment
# Install latest compass-interface-http, gunicorn, and uvicorn
RUN --mount=type=cache,target=/opt/conda/pkgs \
    mamba install --copy --yes "compass-interface-http>=0.25" gunicorn uvicorn

# Clean in a separate layer as calling conda still generates some __pycache__ files
# find all files of various extensions and delete
# find all __pycache__ files and delete
# delete all binaries in /opt/conda/bin except for python itself
# delete unneeded files and paths
# blank out `plistlib` from the stdlib so that we can delete the expat libraries
RUN    find -name '*.a' -delete \
    && find -name '*.pyc' -delete \
    && find -name '*.pyi' -delete \
    && find -name '*.pyx' -delete \
    && find -name '*.js.map' -delete \
    && find -name '__pycache__' -type d -exec rm -rf '{}' '+' \
    && find /opt/conda/bin ! -name 'python*' -type f,l -delete \
    && rm -rf /opt/conda/conda-meta \
              /opt/conda/compiler_compat \
              /opt/conda/condabin \
              /opt/conda/envs \
              /opt/conda/etc \
              /opt/conda/include \
              /opt/conda/lib/krb5 \
              /opt/conda/lib/libpython3.9.so.1.0 \
              /opt/conda/lib/libasan.so.5.0.0 \
              /opt/conda/lib/liblsan.so.0.0.0 \
              /opt/conda/lib/libtsan.so.0.0.0 \
              /opt/conda/lib/libubsan.so.1.0.0 \
              /opt/conda/lib/libk5crypto.so.3.1 \
              /opt/conda/lib/libkadm5clnt_mit.so.12.0 \
              /opt/conda/lib/libkadm5srv_mit.so.12.0 \
              /opt/conda/lib/libkrad.so.0.0 \
              /opt/conda/lib/libkrb5.so.3.3 \
              /opt/conda/lib/libkrb5support.so.0.1 \
              /opt/conda/lib/libsqlite3.so.0.8.6 \
              /opt/conda/lib/libtcl8.6.so \
              /opt/conda/lib/libtk8.6.so \
              /opt/conda/lib/python3.9/site-packages/pip \
              /opt/conda/lib/python3.9/idlelib \
              /opt/conda/lib/python3.9/ensurepip \
              /opt/conda/lib/python3.9/config-3.9-x86_64-linux-gnu \
              /opt/conda/lib/python3.9/distutils \
              /opt/conda/lib/python3.9/lib2to3 \
              /opt/conda/lib/python3.9/lib-dynload/_decimal.cpython-39-x86_64-linux-gnu.so \
              /opt/conda/lib/python3.9/lib-dynload/pyexpat.cpython-39-x86_64-linux-gnu.so \
              /opt/conda/lib/python3.9/pydoc.py \
              /opt/conda/lib/python3.9/pydoc_data \
              /opt/conda/lib/python3.9/site-packages/*.dist-info \
              /opt/conda/lib/python3.9/site-packages/*.egg-info \
              /opt/conda/lib/python3.9/site-packages/conda \
              /opt/conda/lib/python3.9/site-packages/conda_env \
              /opt/conda/lib/python3.9/site-packages/conda_package_handling \
              /opt/conda/lib/python3.9/site-packages/mamba \
              /opt/conda/lib/python3.9/site-packages/phonenumbers/carrierdata \
              /opt/conda/lib/python3.9/site-packages/phonenumbers/geodata \
              /opt/conda/lib/python3.9/site-packages/phonenumbers/tzdata \
              /opt/conda/lib/python3.9/site-packages/pycosat \
              /opt/conda/lib/python3.9/site-packages/pycosat.cpython-39-x86_64-linux-gnu.so \
              /opt/conda/lib/python3.9/site-packages/pycparser \
              /opt/conda/lib/python3.9/site-packages/requests \
              /opt/conda/lib/python3.9/site-packages/ruamel_yaml \
              /opt/conda/lib/python3.9/site-packages/setuptools \
              /opt/conda/lib/python3.9/site-packages/tests \
              /opt/conda/lib/python3.9/site-packages/wheel \
              /opt/conda/lib/python3.9/site-packages/xontrib \
              /opt/conda/lib/python3.9/test \
              /opt/conda/lib/python3.9/tkinter \
              /opt/conda/lib/python3.9/turtledemo \
              /opt/conda/lib/python3.9/turtle.py \
              /opt/conda/lib/python3.9/unittest \
              /opt/conda/lib/sqlite3.34.0 \
              /opt/conda/lib/tcl8 \
              /opt/conda/lib/tcl8.6 \
              /opt/conda/lib/tk8.6 \
              /opt/conda/libexec \
              /opt/conda/man \
              /opt/conda/pkgs \
              /opt/conda/sbin \
              /opt/conda/share/doc \
              /opt/conda/share/grpc \
              /opt/conda/share/locale \
              /opt/conda/share/man \
              /opt/conda/share/info \
              /opt/conda/share/terminfo \
              /opt/conda/shell \
              /opt/conda/x86_64-conda-linux-gnu \
              /opt/conda/x86_64-conda_cos6-linux-gnu \
    && > /opt/conda/lib/python3.9/plistlib.py

# Use the distroless container for execution
FROM gcr.io/distroless/base-debian10

COPY --from=mamba /opt/conda /env

# copy gunicorn config file (this should change very rarely)
ARG gunicorn_conf="gunicorn_conf.py"
COPY $gunicorn_conf "/home/gunicorn_conf.py"

# the gunicorn executable hardcodes the python path, which we change, so run in `python -m` form.
# To use uvicorn, change `gunicorn.app.wsgiapp` to `uvicorn.main`
ENTRYPOINT ["/env/bin/python", "-m", "gunicorn.app.wsgiapp", "-c", "/home/gunicorn_conf.py"]
