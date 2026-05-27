from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import tempfile

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "PTE Backend is running", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "server": "FastAPI"}

@app.post("/ai/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    try:
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Return success for now
        return JSONResponse({
            "transcript": "Recording received successfully",
            "success": True
        })
        
    except Exception as e:
        return JSONResponse({
            "transcript": "",
            "error": str(e),
            "success": False
        }, status_code=500)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 Starting PTE Backend Server")
    print("📍 Server will run on: http://localhost:5000")
    print("📋 Health check: http://localhost:5000/health")
    print("=" * 50)
    uvicorn.run(
        app, 
        host="127.0.0.1", 
        port=5000, 
        reload=True,
        log_level="info"
    )