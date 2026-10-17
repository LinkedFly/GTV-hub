#!/usr/bin/env python3
"""
GTV-hub 本地静态服务器
用法：  python serve.py [端口]    默认 8000
作用： 以正确 MIME 类型提供 ES Module 所需的 .js/.json 文件。
       （Windows 下 `python -m http.server` 会把 .js 当作 text/plain，
        导致 ES Module 加载失败，本脚本修复该问题。）
"""
import http.server
import functools
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# 关键：为 ES Module / fetch 覆盖正确 MIME
http.server.SimpleHTTPRequestHandler.extensions_map.update({
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".json": "application/json",
    ".css": "text/css",
    ".html": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".csv": "text/csv",
})

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)

if __name__ == "__main__":
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"GTV-hub server running at http://127.0.0.1:{PORT}/  (Ctrl+C 停止)")
    httpd.serve_forever()
