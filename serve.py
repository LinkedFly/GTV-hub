#!/usr/bin/env python3
"""
GTV-hub 本地静态服务器
用法：  python serve.py [端口]    默认 8000
作用：
  1) 以正确 MIME 类型提供 ES Module 所需的 .js/.json 文件
     （Windows 下 `python -m http.server` 会把 .js 当作 text/plain，
       导致 ES Module 加载失败，本脚本修复该问题。）
  2) 提供受限的 JSON 保存端点（供「签证规则可编排表格」等把编辑结果写回数据文件）：
       POST /api/save/visa-rules   ->  写入 data/visa-rules/visa-rules.json
       POST /api/save/schedules    ->  写入 data/flight-schedules/schedules.json
     仅允许写入上述白名单路径，防止任意文件写入。
"""
import http.server
import functools
import json
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

# 可保存的白名单：端点路径 -> 数据文件相对路径
SAVE_TARGETS = {
    "/api/save/visa-rules": "data/visa-rules/visa-rules.json",
    "/api/save/schedules": "data/flight-schedules/schedules.json",
}


class GtvHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path not in SAVE_TARGETS:
            self.send_error(404, "Unknown save target")
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else b"{}"
            payload = json.loads(body.decode("utf-8"))
            rel = SAVE_TARGETS[self.path]
            target = os.path.join(ROOT, rel)
            # 确保目标文件确实存在于预期位置（防止路径被篡改）
            real_target = os.path.realpath(target)
            real_root = os.path.realpath(ROOT)
            if not real_target.startswith(real_root + os.sep):
                self.send_error(403, "Path not allowed")
                return
            os.makedirs(os.path.dirname(real_target), exist_ok=True)
            with open(real_target, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            resp = json.dumps({"ok": True, "path": rel}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
        except Exception as e:  # noqa: BLE001
            self.send_error(500, f"Save failed: {e}")


Handler = functools.partial(GtvHandler, directory=ROOT)

if __name__ == "__main__":
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"GTV-hub server running at http://127.0.0.1:{PORT}/  (Ctrl+C 停止)")
    httpd.serve_forever()
