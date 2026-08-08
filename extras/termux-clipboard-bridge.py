#!/usr/bin/env python3
import os
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


HOST = os.environ.get("TERMUX_CLIPBOARD_BRIDGE_HOST", "127.0.0.1")
PORT = int(os.environ.get("TERMUX_CLIPBOARD_BRIDGE_PORT", "8765"))
MAX_BYTES = int(os.environ.get("TERMUX_CLIPBOARD_BRIDGE_MAX_BYTES", "1048576"))
COMMAND_TIMEOUT = float(os.environ.get("TERMUX_CLIPBOARD_BRIDGE_COMMAND_TIMEOUT", "3"))


def run_termux_clipboard(command, **kwargs):
    try:
        return subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=COMMAND_TIMEOUT,
            **kwargs,
        )
    except FileNotFoundError as error:
        return subprocess.CompletedProcess(command, 127, b"", f"{error}\n".encode())
    except subprocess.TimeoutExpired:
        message = f"{' '.join(command)} timed out after {COMMAND_TIMEOUT:g}s\n"
        return subprocess.CompletedProcess(command, 124, b"", message.encode())


class ClipboardBridge(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/get":
            self.send_error(404)
            return

        result = run_termux_clipboard(["termux-clipboard-get"])
        if result.returncode != 0:
            self.send_response(504 if result.returncode == 124 else 502)
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
        result = run_termux_clipboard(
            ["termux-clipboard-set"],
            input=data,
        )
        if result.returncode != 0:
            self.send_response(504 if result.returncode == 124 else 502)
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
