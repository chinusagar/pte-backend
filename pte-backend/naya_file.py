print("Server starting...")
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "message": "Server is working!"})

@app.route('/')
def home():
    return "PTE Backend is running"

print("Starting server on port 5000...")
if __name__ == '__main__':
    app.run(host='localhost', port=5001, debug=True)