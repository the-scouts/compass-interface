import pytest
import uvicorn

from util.fake_compass import app
from util.http import Server


@pytest.fixture(scope="session")
def server():
    print("Starting uvicorn server!")
    config = uvicorn.Config(app, host="127.0.0.1", port=4200, log_level="info")
    server = Server(config=config)
    with server.run_in_thread():
        yield
