from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import tempfile

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

@app.route('/ai/transcribe', methods=['POST'])
def transcribe():
    try:
        # Check if file exists
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file", "transcript": ""}), 400
        
        audio_file = request.files['audio']
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
            audio_file.save(tmp.name)
            file_size = os.path.getsize(tmp.name)
            tmp_path = tmp.name
        
        # Cleanup
        os.unlink(tmp_path)
        
        # Return mock transcript for testing
        return jsonify({
            "transcript": "This is a test transcript. Your recording was received successfully.",
            "file_size": file_size,
            "success": True
        })
        
    except Exception as e:
        return jsonify({"error": str(e), "transcript": ""}), 500

if __name__ == '__main__':
    print("🚀 Server starting on http://localhost:5000")
    app.run(port=5000, debug=True)