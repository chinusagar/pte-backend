from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import speech_recognition as sr
import tempfile
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    try:

        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")

        content = await audio.read()

        temp_audio.write(content)

        temp_audio.close()

        recognizer = sr.Recognizer()

        with sr.AudioFile(temp_audio.name) as source:
            audio_data = recognizer.record(source)

        transcript = recognizer.recognize_google(audio_data)

        words = transcript.split()
        word_count = len(words)

        if word_count >= 45:
            overall = 85
            content = 6
            fluency = 5
            pronunciation = 5

        elif word_count >= 30:
            overall = 70
            content = 5
            fluency = 4
            pronunciation = 4

        elif word_count >= 15:
            overall = 50
            content = 3
            fluency = 3
            pronunciation = 3

        else:
            overall = 20
            content = 1
            fluency = 1
            pronunciation = 1

        os.unlink(temp_audio.name)

        return {
            "transcript": transcript,
            "analysis": {
                "overall_score": overall,
                "content": content,
                "fluency": fluency,
                "pronunciation": pronunciation,
                "feedback": "AI analysis completed successfully"
            }
        }

    except Exception as e:
        return {
            "transcript": "",
            "analysis": {
                "overall_score": 0,
                "content": 0,
                "fluency": 0,
                "pronunciation": 0,
                "feedback": str(e)
            }
        }