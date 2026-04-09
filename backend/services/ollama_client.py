import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

def call_ollama(prompt: str, model: str = "llama3") -> str:
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": model,
            "prompt": prompt,
            "stream": False
        }
    )

    result = response.json()
    return result.get("response", "")