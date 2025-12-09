# backend/app.py
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from models import AnalyzeResponse
from analyzer import analyze_document
from config import BACKEND_PORT

app = FastAPI(title="SmartDocs Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "sample_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    data = analyze_document(file_path)
    return JSONResponse(content=data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=BACKEND_PORT, reload=True)
