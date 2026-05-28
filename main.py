from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend Running"}

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    return {
        "analysis": {
            "overall_score": 70,
            "content": 5,
            "fluency": 4,
            "pronunciation": 4,
            "feedback": "Good fluency and pronunciation."
        },
        "transcript": "Sample transcript"
    }