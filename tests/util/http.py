from collections.abc import Iterator
import contextlib
import threading
import time

import uvicorn


# https://github.com/encode/uvicorn/issues/742#issuecomment-674411676
# TODO use https://github.com/encode/uvicorn/pull/917
class Server(uvicorn.Server):
    def install_signal_handlers(self):
        pass

    @contextlib.contextmanager
    def run_in_thread(self) -> Iterator[None]:
        thread = threading.Thread(target=self.run)
        thread.start()
        try:
            while not self.started:
                time.sleep(1e-3)
            yield
        finally:
            self.should_exit = True
            thread.join()
