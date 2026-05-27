from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import speech_recognition as sr
import tempfile
import os
import shutil
from difflib import SequenceMatcher
from pydub import AudioSegment
import io
import math

app = FastAPI(title="Genebyte PTE Read Aloud API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def word_similarity(word1, word2):
    """Calculate similarity between two words"""
    return SequenceMatcher(None, word1.lower(), word2.lower()).ratio()

def calculate_pte_scores(transcript, expected_text):
    """Calculate PTE Read Aloud scores"""
    import re
    expected_clean = re.sub(r'[^\w\s]', '', expected_text.lower())
    transcript_clean = re.sub(r'[^\w\s]', '', transcript.lower())
    
    expected_words = expected_clean.split()
    spoken_words = transcript_clean.split()
    
    total_words = len(expected_words)
    spoken_count = len(spoken_words)
    
    if total_words == 0:
        return {
            "overall": 0,
            "content": 0,
            "fluency": 0,
            "pronunciation": 0,
            "matchedWords": 0,
            "expectedWords": 0,
            "spokenWords": 0,
            "wordAccuracy": 0,
            "feedback": "No reference text provided."
        }
    
    # Advanced word matching with similarity
    matched_words = 0
    total_similarity = 0
    
    used_indices = []
    
    for spoken in spoken_words:
        best_match_idx = -1
        best_similarity = 0
        
        for idx, expected in enumerate(expected_words):
            if idx in used_indices:
                continue
            sim = word_similarity(spoken, expected)
            if sim > best_similarity and sim > 0.6:
                best_similarity = sim
                best_match_idx = idx
        
        if best_match_idx != -1:
            matched_words += 1
            total_similarity += best_similarity
            used_indices.append(best_match_idx)
    
    # Calculate accuracy percentage
    if total_words > 0:
        word_accuracy = (matched_words / total_words) * 100
    else:
        word_accuracy = 0
    
    # Content Score (0-6)
    if word_accuracy >= 95:
        content_score = 6.0
    elif word_accuracy >= 85:
        content_score = 5.5
    elif word_accuracy >= 75:
        content_score = 5.0
    elif word_accuracy >= 65:
        content_score = 4.0
    elif word_accuracy >= 55:
        content_score = 3.0
    elif word_accuracy >= 40:
        content_score = 2.0
    elif word_accuracy >= 20:
        content_score = 1.0
    else:
        content_score = 0.0
    
    # Fluency Score (0-5)
    completion_ratio = spoken_count / total_words if total_words > 0 else 0
    
    if completion_ratio >= 0.95 and spoken_count >= total_words - 2:
        fluency_score = 5
    elif completion_ratio >= 0.85:
        fluency_score = 4
    elif completion_ratio >= 0.70:
        fluency_score = 3
    elif completion_ratio >= 0.50:
        fluency_score = 2
    elif completion_ratio >= 0.30:
        fluency_score = 1
    else:
        fluency_score = 0
    
    # Pronunciation Score (0-5)
    if spoken_count > 0:
        avg_pronunciation = (total_similarity / spoken_count) * 100
    else:
        avg_pronunciation = 0
    
    if avg_pronunciation >= 85:
        pronunciation_score = 5
    elif avg_pronunciation >= 70:
        pronunciation_score = 4
    elif avg_pronunciation >= 55:
        pronunciation_score = 3
    elif avg_pronunciation >= 40:
        pronunciation_score = 2
    elif avg_pronunciation >= 20:
        pronunciation_score = 1
    else:
        pronunciation_score = 0
    
    # Overall Score (0-90)
    overall_score = (
        (content_score / 6) * 40 +
        (fluency_score / 5) * 30 +
        (pronunciation_score / 5) * 30
    )
    overall_score = min(90, max(0, round(overall_score)))
    
    # Generate feedback
    feedback_parts = []
    
    if word_accuracy >= 90:
        feedback_parts.append("Excellent content coverage!")
    elif word_accuracy >= 75:
        feedback_parts.append("Good content coverage. A few words were missed.")
    elif word_accuracy >= 60:
        feedback_parts.append("Fair content coverage. Practice reading all words.")
    else:
        feedback_parts.append("Low content coverage. Read the complete sentence.")
    
    if completion_ratio >= 0.9:
        feedback_parts.append("Excellent fluency!")
    elif completion_ratio >= 0.7:
        feedback_parts.append("Good fluency. Try to reduce pauses.")
    else:
        feedback_parts.append("Work on reading smoothly without stopping.")
    
    if avg_pronunciation >= 80:
        feedback_parts.append("Excellent pronunciation!")
    elif avg_pronunciation >= 65:
        feedback_parts.append("Good pronunciation. Some words need clarity.")
    else:
        feedback_parts.append("Pronunciation needs improvement.")
    
    return {
        "overall": overall_score,
        "content": round(content_score, 1),
        "fluency": fluency_score,
        "pronunciation": pronunciation_score,
        "matchedWords": matched_words,
        "expectedWords": total_words,
        "spokenWords": spoken_count,
        "wordAccuracy": round(word_accuracy, 1),
        "pronunciationAccuracy": round(avg_pronunciation, 1),
        "feedback": " ".join(feedback_parts)
    }

def convert_audio_to_wav(audio_bytes, original_format="webm"):
    """Convert audio to WAV format"""
    try:
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format=original_format)
        wav_io = io.BytesIO()
        audio.export(wav_io, format="wav")
        wav_io.seek(0)
        return wav_io
    except Exception as e:
        print(f"Audio conversion error: {e}")
        return None

@app.post("/api/analyze")
async def analyze_recording(
    audio: UploadFile = File(...),
    question: str = Form(...)
):
    """Analyze the recorded audio and return PTE-style scores"""
    
    temp_file = None
    
    try:
        audio_bytes = await audio.read()
        
        if len(audio_bytes) < 5000:
            return JSONResponse(
                status_code=200,
                content={
                    "transcript": "",
                    "analysis": {
                        "overall": 0,
                        "content": 0,
                        "fluency": 0,
                        "pronunciation": 0,
                        "matchedWords": 0,
                        "expectedWords": len(question.split()),
                        "spokenWords": 0,
                        "wordAccuracy": 0,
                        "pronunciationAccuracy": 0,
                        "feedback": "Audio recording too short. Please record a longer response."
                    }
                }
            )
        
        wav_audio = convert_audio_to_wav(audio_bytes, "webm")
        
        recognizer = sr.Recognizer()
        transcript = ""
        
        if wav_audio:
            with sr.AudioFile(wav_audio) as source:
                try:
                    recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio_data = recognizer.record(source)
                    transcript = recognizer.recognize_google(audio_data)
                except sr.UnknownValueError:
                    transcript = ""
                except sr.RequestError as e:
                    print(f"Speech recognition error: {e}")
                    transcript = ""
        
        if not transcript or transcript == "":
            transcript = "[No speech detected]"
        
        analysis = calculate_pte_scores(transcript, question)
        
        return {
            "transcript": transcript,
            "analysis": analysis
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return JSONResponse(
            status_code=200,
            content={
                "transcript": "",
                "analysis": {
                    "overall": 0,
                    "content": 0,
                    "fluency": 0,
                    "pronunciation": 0,
                    "matchedWords": 0,
                    "expectedWords": len(question.split()),
                    "spokenWords": 0,
                    "wordAccuracy": 0,
                    "pronunciationAccuracy": 0,
                    "feedback": f"Error: {str(e)[:100]}"
                }
            }
        )

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Genebyte PTE API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)