from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
import fitz, edge_tts, os
from engine import ml_engine, generate_json, generate_text

router = APIRouter()

class ChatReq(BaseModel): query: str; context: str
class AudioReq(BaseModel): duration: int

async def process_docs(files: list[UploadFile]):
    for file in files:
        text = chr(12).join([page.get_text() for page in fitz.open(stream=await file.read(), filetype="pdf")])
        # In prod: Save text & ml_engine.embed(chunks) to Vector DB (e.g., Supabase pgvector)
        print(f"Processed {file.filename}: {len(text)} chars")

@router.post("/upload")
async def upload(bg_tasks: BackgroundTasks, files: list[UploadFile] = File(...), categories: list[str] = Form(...)):
    bg_tasks.add_task(process_docs, files)
    return {"message": "Started", "topics": [{"id": "t1", "name": "Module 1", "frequency": 5, "importance": "High", "color": "text-rose-500"}]}

@router.get("/topic/{topic}")
async def get_topic(topic: str):
    notes = await generate_text(f"Write a markdown summary of {topic}")
    return {
        "topic": topic,
        "notes": {"content": notes, "isAiGenerated": True},
        "practice": [{"id": "q1", "category": "Long", "question": f"Explain {topic}", "answer": "Answer here.", "marks": 10}],
        "analysis": {"totalQuestions": 10, "yearsAppeared": ["2023", "2022"], "avgMarks": 10, "mostAskedQuestions": []},
        "audio": {"transcript": []}
    }

@router.post("/audio/{topic}")
async def get_audio(topic: str, req: AudioReq):
    script = await generate_text(f"Podcast transcript for {topic}")
    path = f"/tmp/{topic}.mp3"
    await edge_tts.Communicate(script, "en-US-ChristopherNeural").save(path)
    # In prod: upload `path` to S3/Supabase and return the public URL.
    return {"transcript": [{"time": 0, "text": script}], "audioUrl": "mock_url.mp3"}

@router.post("/chat")
async def chat(req: ChatReq):
    return {"response": await generate_text(req.query, req.context), "sourceName": "AI Synthesized"}