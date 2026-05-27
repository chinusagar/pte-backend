from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = json.dumps({"status": "healthy"})
            self.wfile.write(response.encode())
        else:
            self.send_response(404)
            self.end_headers()

print("Server starting on http://localhost:5000")
HTTPServer(("localhost", 5000), Handler).serve_forever()