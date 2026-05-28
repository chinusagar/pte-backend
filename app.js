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
    return {"message": "PTE Backend Running"}

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):

    return {
        "analysis": {
            "overall_score": 65,
            "content": 4,
            "fluency": 4,
            "pronunciation": 3,
            "feedback": "Good fluency. Improve pronunciation clarity."
        },
        "transcript": "Sample transcript generated"
    }from fastapi import FastAPI, UploadFile, File
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
    return {"message": "PTE Backend Running"}

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):

    return {
        "analysis": {
            "overall_score": 65,
            "content": 4,
            "fluency": 4,
            "pronunciation": 3,
            "feedback": "Good fluency. Improve pronunciation clarity."
        },
        "transcript": "Sample transcript generated"
    }