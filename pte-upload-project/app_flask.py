from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

@app.route('/')
def home():
    return "Server is running"

if __name__ == '__main__':
    print("Server starting on http://localhost:5000")
    app.run(port=5000, debug=True)