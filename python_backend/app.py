import sys
import os
import shutil
import base64
import json
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from pydantic import BaseModel
import uvicorn

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# --- Imports from local modules (we will copy the logic here or import) ---
# To keep it simple for the user, I'll inline the critical logic or expect the files to be present.
# For Cleanliness, let's assume valid imports if files exist, else we define fallback.

# We will copy the original scripts into this folder as modules
# but we need to slightly adapt them to be callable functions rather than CLI scripts.
# For now, I will use `subprocess` or imports. Imports are better for persistent memory (loading models once).

# --- MODEL LOADING ---
from sentence_transformers import SentenceTransformer
import easyocr
# from ultralytics import YOLO # Load on demand or global

# Global Models (Lazy Load)
_sentence_model = None
_ocr_reader = None

def get_sentence_model():
    global _sentence_model
    if _sentence_model is None:
        _sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _sentence_model

def get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        _ocr_reader = easyocr.Reader(['en'], gpu=False)
    return _ocr_reader

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Civic Lens AI Backend is running"}

# --- VOTER VERIFICATION ---
class VerifyVoterInput(BaseModel):
    voterId: str
    frontImage: str # Base64
    backImage: Optional[str] = None # Base64

@app.post("/verify-voter")
async def verify_voter_endpoint(data: VerifyVoterInput):
    try:
        # Save temp files for the existing logic to work (it expects paths)
        # OR refactor logic to use bytes. Existing logic uses EasyOCR with file paths or bytes. 
        # EasyOCR `readtext` accepts bytes directly!
        
        import verify_voter_logic
        
        # Decode base64
        front_bytes = base64.b64decode(data.frontImage.replace("data:image/jpeg;base64,", "").replace("data:image/png;base64,", ""))
        back_bytes = None
        if data.backImage and data.backImage != "NONE":
             back_bytes = base64.b64decode(data.backImage.replace("data:image/jpeg;base64,", "").replace("data:image/png;base64,", ""))

        result = verify_voter_logic.verify_voter_card_memory(front_bytes, back_bytes, data.voterId)
        return result
    except Exception as e:
        logger.error(f"Verification Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- DUPLICATE DETECTION ---
class DuplicateCheckInput(BaseModel):
    issueId: str
    mongoUri: str
    dbName: str

@app.post("/detect-duplicates")
async def detect_duplicates_endpoint(data: DuplicateCheckInput):
    try:
        import detect_duplicates_logic
        # We pass the ID and Mongo details. The script logic connects to Mongo.
        # Note: 'project_root' is less relevant here if images are Base64.
        # We'll pass a dummy root for now.
        
        result = detect_duplicates_logic.detect_duplicates(
            data.mongoUri, 
            data.issueId, 
            "/app", # Dummy root for cloud env
            data.dbName
        )
        return result
    except Exception as e:
        logger.error(f"Duplicate Error: {e}")
        return {"matches": [], "error": str(e)}

# --- TRAFFIC VIOLATION ---
class ViolationInput(BaseModel):
    image: str # Base64

@app.post("/detect-violation")
async def detect_violation_endpoint(data: ViolationInput):
    try:
        import detect_violation_logic
        
        # Decode base64
        # Handle header if present
        b64_str = data.image
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
            
        img_bytes = base64.b64decode(b64_str)
        
        result = detect_violation_logic.detect_violation_memory(img_bytes)
        return result
    except Exception as e:
        logger.error(f"Violation Detection Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860) # 7860 is HF Spaces default port
