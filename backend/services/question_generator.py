import json
import re
from services.ollama_client import call_ollama

def extract_json(text: str) -> str:
    # Remove code block markers like ```json ... ```
    text = re.sub(r"```json", "", text)
    text = re.sub(r"```", "", text)

    # Extract JSON part using regex
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)

    return text


def generate_questions(cv_text: str) -> dict:
    cv_text = cv_text[:3000]  # limit size

    prompt = f"""
You are a highly experienced technical interviewer.

Your job is to generate personalized interview questions based STRICTLY on the candidate's CV.

CV:
{cv_text}

INSTRUCTIONS:

1. Focus on:
   - Projects mentioned (ask HOW they built it)
   - Technologies used (ask WHY and HOW)
   - Skills listed (ask depth + real-world usage)

2. Questions MUST:
   - Be specific to the candidate's CV
   - Test practical understanding (not theory only)
   - Include "how", "why", "design", "improve", "challenges"

3. Avoid:
   - Generic questions (e.g., "What is Python?")
   - Questions not related to the CV

4. Difficulty Levels:
   - EASY → basic understanding of their own work
   - MEDIUM → implementation + reasoning
   - HARD → design, optimization, real-world scaling

5. Examples of GOOD questions:
   - "How did you implement TF-IDF in your project and why did you choose it?"
   - "What challenges did you face while building your fake news detection system?"
   - "How would you improve the accuracy of your model?"
   - "If your system had to scale to millions of users, what changes would you make?"

OUTPUT FORMAT (STRICT JSON ONLY):
{{
  "easy": ["q1", "q2", "q3"],
  "medium": ["q1", "q2", "q3"],
  "hard": ["q1", "q2"]
}}
"""

    response = call_ollama(prompt)

    cleaned = extract_json(response)

    try:
        return json.loads(cleaned)
    except Exception as e:
        return {
            "error": "Failed to parse JSON",
            "raw": response
        }