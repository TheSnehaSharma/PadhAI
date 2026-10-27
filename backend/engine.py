from fastembed import TextEmbedding
from litellm import acompletion
import numpy as np
import json

class MLEngine:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLEngine, cls).__new__(cls)
            cls._instance.model = TextEmbedding("BAAI/bge-small-en-v1.5") # Tiny local model
        return cls._instance

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [emb.tolist() for emb in self.model.embed(texts)]

ml_engine = MLEngine()
MODEL_POOL = [
    "groq/llama-3.1-70b-versatile", 
    "gemini/gemini-1.5-flash-latest", 
    "gemini/gemini-pro"
]

async def generate_json(prompt: str) -> dict:
    try:
        res = await acompletion(
            model=MODEL_POOL[0], fallbacks=MODEL_POOL[1:],
            messages=[{"role": "system", "content": "Output raw JSON."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(res.choices[0].message.content)
    except: return {}

async def generate_text(prompt: str, context: str = "") -> str:
    res = await acompletion(
        model=MODEL_POOL[0], fallbacks=MODEL_POOL[1:],
        messages=[{"role": "system", "content": f"Context: {context}"}, {"role": "user", "content": prompt}]
    )
    return res.choices[0].message.content
