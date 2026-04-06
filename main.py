from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from celery.result import AsyncResult
from ai_engine import AIEngine
from celery_app import celery_instance, train_model_task, generate_data_task

app = FastAPI(
    title="Well7 Track A Algorithm API",
    description="Asynchronous processing engine utilizing Celery + Redis for PDPL-compliant data synthesis."
)

class TrainRequest(BaseModel):
    dataset_url: str
    config: dict

class GenerateRequest(BaseModel):
    model_id: str
    num_rows: int
    original_dataset_url: str

@app.post("/api/v1/ingest", summary="1. Preprocessing & Data Ingestion API")
async def ingest_dataset(file: UploadFile = File(...)):
    """
    Accepts CSV Dataset File. In production, this might just accept an S3 URL,
    but we will upload via multipart-form to mock S3.
    """
    try:
        content = await file.read()
        res = AIEngine.preprocess_dataset(content)
        return JSONResponse(content={
            "message": "Dataset preprocessed successfully",
            "s3_url": res["s3_url"],
            "profile": res["profile"]
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/train", summary="2. Model Training API")
async def train_model(request: TrainRequest):
    """
    Triggers asynchronous model training queue via Celery + Redis.
    """
    try:
        task = train_model_task.delay(request.dataset_url, request.config)
        return JSONResponse(content={
            "message": "Training job queued successfully",
            "job_id": task.id
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/generate", summary="3. Generation & Evaluation API")
async def generate_synthetic_data(request: GenerateRequest):
    """
    Triggers asynchronous generation job. Provides URL to resulting set and Evaluation Metrics.
    """
    try:
        task = generate_data_task.delay(request.model_id, request.num_rows, request.original_dataset_url)
        return JSONResponse(content={
            "message": "Generation job queued successfully",
            "job_id": task.id
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/jobs/{job_id}", summary="4. Expose Job Status Endpoint")
async def get_job_status(job_id: str):
    """
    Real-time polling endpoint for the frontend to check Celery task progress.
    """
    task_result = AsyncResult(job_id, app=celery_instance)
    
    response = {
        "job_id": job_id,
        "status": task_result.status,
    }
    
    if task_result.status == 'SUCCESS':
        response["result"] = task_result.result
    elif task_result.status == 'FAILURE':
        response["error"] = str(task_result.result)
        
    return JSONResponse(content=response)
