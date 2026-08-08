#!/usr/bin/env python3
import os
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


HOST = os.environ.get("TERMUX_CLIPBOARD_BRIDGE_HOST", "127.0.0.1")
PORT = int(os.environ.get("TERMUX_CLIPBOARD_BRIDGE_PORT", "8765"))
MAX_BYTES = int(os.environ.get("TERMUX_CLIPBOARD_BRIDGE_MAX_BYTES", "1048576"))


class ClipboardBridge(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/get":
            self.send_error(404)
            return

        result = subprocess.run(
            ["termux-clipboard-get"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode != 0:
            self.send_response(502)
            self.end_headers()
            self.wfile.write(result.stderr)
            return

        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(result.stdout)

    def do_POST(self):
        if self.path != "/set":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", "0"))
        if length > MAX_BYTES:
            self.send_error(413)
            return

        data = self.rfile.read(length)
        result = subprocess.run(
            ["termux-clipboard-set"],
            input=data,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode != 0:
            self.send_response(502)
            self.end_headers()
            self.wfile.write(result.stderr)
            return

        self.send_response(204)
        self.end_headers()

    def log_message(self, format, *args):
        return


def main():
    server = ThreadingHTTPServer((HOST, PORT), ClipboardBridge)
    print(f"Termux clipboard bridge listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
