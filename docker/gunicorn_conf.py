from os import cpu_count as _cores, getenv as _getenv

# Non-gunicorn variables
host = _getenv("HOST", "0.0.0.0")
port = _getenv("PORT", "80")

# Gunicorn config variables
loglevel = _getenv("LOG_LEVEL", "info")
workers = int(_getenv("WEB_CONCURRENCY", "0")) or max(int(_getenv("WORKERS_PER_CORE", "1")) * (_cores() or 0), 2)
bind = _getenv("BIND", f"{host}:{port}")
errorlog = _getenv("ERROR_LOG", "-") or None
worker_tmp_dir = "/dev/shm"
accesslog = _getenv("ACCESS_LOG", "-") or None
graceful_timeout = int(_getenv("GRACEFUL_TIMEOUT", "120"))
timeout = int(_getenv("TIMEOUT", "120"))
keepalive = int(_getenv("KEEP_ALIVE", "5"))

# Print out all the config variables
print("GUNICORN CONFIGURATION:")
_padding = max(len(name) for name in locals() if not name.startswith("_")) + 1
_name = _value = None  # pre-define, else get "RuntimeError: dictionary changed size during iteration"
for _name, _value in locals().items():
    if not _name.startswith("_"):
        _name = _name + ":"
        print(f"{_name:<{_padding}} {_value}")
