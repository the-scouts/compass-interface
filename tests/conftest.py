import pytest
import uvicorn

from tests.util.fake_compass import app
from tests.util.http import Server


@pytest.fixture(scope="session")
def server():
    print("Starting uvicorn server!")
    config = uvicorn.Config(app, host="127.0.0.1", port=4200, log_level="info")
    server = Server(config=config)
    with server.run_in_thread():
        yield
