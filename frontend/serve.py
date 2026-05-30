#!/usr/bin/env python3
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4200
DIR = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.abspath('dist/frontend/browser')

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path):
            self.path = '/index.html'
        return super().send_head()

if __name__ == '__main__':
    httpd = http.server.HTTPServer(('0.0.0.0', PORT), SPAHandler)
    print(f'Serving SPA at http://localhost:{PORT}')
    print(f'Directory: {DIR}')
    print(f'All routes fallback to index.html')
    httpd.serve_forever()
