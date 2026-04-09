from fastapi import FastAPI, UploadFile, File
import shutil
import os
from fastapi.middleware.cors import CORSMiddleware
from services.parser import extract_text_from_pdf
from services.question_generator import generate_questions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text
    cv_text = extract_text_from_pdf(file_path)

    # Generate questions using Ollama
    questions = generate_questions(cv_text)

    return {
        "filename": file.filename,
        "questions": questions
    }
from fastapi import Body
from services.ollama_client import call_ollama

import json
import re

def extract_json(text: str) -> str:
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)

    return text


@app.post("/evaluate")
def evaluate_answer(question: str = Body(...), answer: str = Body(...)):
    prompt = f"""
You are a strict technical interviewer.

Question:
{question}

Candidate Answer:
{answer}

IMPORTANT:
- You MUST return ALL fields
- Do NOT leave anything empty

Rules:
- score must be a number (0–10)
- strengths must have at least 1 item
- weaknesses must have at least 1 item
- ideal_answer must NOT be empty

Return ONLY JSON:

{{
  "score": number,
  "strengths": ["point1"],
  "weaknesses": ["point1"],
  "ideal_answer": "text"
}}
"""

    response = call_ollama(prompt)

    cleaned = extract_json(response)

    import json
    try:
        return json.loads(cleaned)
    except:
        return {
            "error": "Parsing failed",
            "raw": response
        }