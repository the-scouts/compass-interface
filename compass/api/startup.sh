#! /usr/bin/env sh
set -e

export APP_MODULE=${APP_MODULE:-"main:app"}
export GUNICORN_CONF=${GUNICORN_CONF:-"/gunicorn_conf.py"}
export WORKER_CLASS=${WORKER_CLASS:-"uvicorn.workers.UvicornWorker"}

## If there's a prestart.sh script in the /app directory or other path specified, run it before starting
#PRE_START_PATH=${PRE_START_PATH:-/app/prestart.sh}
#echo "Checking for script in $PRE_START_PATH"
#if [ -f $PRE_START_PATH ] ; then
#    echo "Running script $PRE_START_PATH"
#    . "$PRE_START_PATH"
#else
#    echo "There is no script $PRE_START_PATH"
#fi

# Start Gunicorn
exec gunicorn -k "$WORKER_CLASS" -c "$GUNICORN_CONF" "$APP_MODULE"