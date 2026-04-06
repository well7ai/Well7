import os
from celery import Celery
from ai_engine import AIEngine

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_instance = Celery(
    "well7_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Optional configuration
celery_instance.conf.update(
    task_serializer='json',
    accept_content=['json'],  
    result_serializer='json',
    timezone='Asia/Riyadh',
    enable_utc=True,
)

@celery_instance.task(bind=True)
def train_model_task(self, dataset_url: str, config: dict):
    """
    Background task to train the generative model.
    """
    # Celery state can be updated here if tracking fine-grained progress is needed
    try:
        model_id = AIEngine.train_model(dataset_url, config)
        return {"status": "success", "model_id": model_id}
    except Exception as e:
        return {"status": "error", "error_message": str(e)}

@celery_instance.task(bind=True)
def generate_data_task(self, model_id: str, num_rows: int, original_dataset_url: str):
    """
    Background task to generate synthetic data and run evaluations.
    """
    try:
        result = AIEngine.generate_synthetic_data(model_id, num_rows, original_dataset_url)
        return {
            "status": "success",
            "synthetic_dataset_url": result["synthetic_dataset_url"],
            "evaluation_report": result["evaluation_report"]
        }
    except Exception as e:
         return {"status": "error", "error_message": str(e)}
