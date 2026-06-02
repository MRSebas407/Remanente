import http.server
import os
import ssl
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

    cert_file = os.environ.get('SSL_CERT') or os.path.join(os.path.dirname(__file__), 'server.pem')
    key_file = os.environ.get('SSL_KEY') or os.path.join(os.path.dirname(__file__), 'server-key.pem')

    if os.path.exists(cert_file) and os.path.exists(key_file):
        httpd.socket = ssl.wrap_socket(httpd.socket, certfile=cert_file, keyfile=key_file, server_side=True)
        protocol = 'https'
    else:
        protocol = 'http'

    print(f'Serving SPA at {protocol}://0.0.0.0:{PORT}')
    print(f'Directory: {DIR}')
    print(f'All routes fallback to index.html')
    if protocol == 'https':
        print(f'From another device: {protocol}://{os.environ.get("HOST_IP", "<TU_IP>")}:{PORT}')
    httpd.serve_forever()
