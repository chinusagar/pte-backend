from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os

app = Flask(__name__)
CORS(app)

model = whisper.load_model("base")

@app.route("/")
def home():
    return "Python AI Server Running"

@app.route("/transcribe", methods=["POST"])
def transcribe():

    try:

        if "audio" not in request.files:

            return jsonify({
                "error": "No audio file"
            }), 400

        audio = request.files["audio"]

        temp_audio = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".webm"
        )

        audio.save(temp_audio.name)

        result = model.transcribe(
            temp_audio.name
        )

        transcript = result["text"]

        os.remove(temp_audio.name)

        words = transcript.strip().split()

        word_count = len(words)

        # SCORING

        content = 1
        fluency = 1
        pronunciation = 1

        if word_count >= 45:

            content = 6
            fluency = 5
            pronunciation = 5

        elif word_count >= 35:

            content = 5
            fluency = 4
            pronunciation = 4

        elif word_count >= 25:

            content = 4
            fluency = 3
            pronunciation = 3

        elif word_count >= 15:

            content = 3
            fluency = 2
            pronunciation = 2

        overall = round(

            (
                (
                    (content / 6) * 90 +
                    (fluency / 5) * 90 +
                    (pronunciation / 5) * 90
                ) / 3
            )

        )

        return jsonify({

            "transcript": transcript,

            "analysis": {

                "overall_score": overall,
                "content": content,
                "fluency": fluency,
                "pronunciation": pronunciation,

                "feedback":
                    "Excellent reading performance."
                    if overall >= 75
                    else
                    "Good attempt. Improve fluency."

            }

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

app.run(
    host="0.0.0.0",
    port=8000
)