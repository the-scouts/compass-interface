from os import cpu_count, getenv  # isort: skip

# Non-gunicorn variables
host = getenv("HOST", "0.0.0.0")
port = getenv("PORT", "80")

# Gunicorn config variables
loglevel = getenv("LOG_LEVEL", "debug")
workers = int(getenv("WEB_CONCURRENCY", 0)) or max(int(getenv("WORKERS_PER_CORE", 1)) * (cpu_count() or 0), 2)
bind = getenv("BIND", f"{host}:{port}")
errorlog = getenv("ERROR_LOG", "-") or None
worker_tmp_dir = "/dev/shm"
accesslog = getenv("ACCESS_LOG", "-") or None
graceful_timeout = int(getenv("GRACEFUL_TIMEOUT", 120))
timeout = int(getenv("TIMEOUT", 120))
keepalive = int(getenv("KEEP_ALIVE", 5))
worker_class = getenv("WORKER_CLASS", "uvicorn.workers.UvicornWorker")
