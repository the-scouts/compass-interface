#!/bin/bash
conda --version
source activate compass-interface
conda env list
gunicorn -k "$worker_class" -c "$gunicorn_conf_file" "$app_module"
