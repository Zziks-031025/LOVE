"""LOVE 本地预览服务器（自动禁用浏览器缓存）。

用法：
    python serve.py                     # http://127.0.0.1:8000/
    python serve.py --port 8080         # 换端口
    python serve.py --host 0.0.0.0      # 允许同局域网手机访问

改完 js / css / html 后，普通刷新即可看到最新内容，不会被浏览器缓存挡住。
"""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description="LOVE 本地预览服务器（禁用缓存）")
    parser.add_argument("--host", default="127.0.0.1", help="监听地址，默认 127.0.0.1")
    parser.add_argument("--port", type=int, default=8000, help="端口，默认 8000")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    handler = partial(NoCacheHandler, directory=str(root))
    server = ThreadingHTTPServer((args.host, args.port), handler)

    print(f"LOVE 本地预览: http://127.0.0.1:{args.port}/  (已禁用缓存，改完直接刷新)")
    print("按 Ctrl+C 停止。")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
