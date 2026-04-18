# Well7 Synthetic Data Platform

## Overview
**Well7** is a fast, robust, and PDPL-compliant synthetic data platform built for the Saudi market (e.g., banks, healthcare). It features an end-to-end asynchronous data pipeline that handles CSV dataset ingestion, automated AI model training, and real-time synthetic data generation and evaluation metrics. 

The platform is designed to provide an institutional-grade user experience with a modern React frontend and a highly scalable asynchronous Python backend.

---

## Tech Stack

### Frontend
- **React (v19) & Vite**: A lightning-fast, modern frontend setup.
- **Tailwind CSS (v4)**: Modern, utility-first CSS framework for premium "Newera" cyber-aesthetic styling.
- **Recharts**: For dynamic, real-time data visualization on generation status dashboards.
- **Lucide React**: Crisp and responsive icon integrations.

### Backend (Track A Algorithm API)
- **FastAPI**: High-performance asynchronous API handling all data operations.
- **Celery & Redis**: Background task tracking and queueing for resource-heavy AI model training and synthetic data generation.
- **Python Data Ecosystem**: Uses `pandas`, `numpy`, and `scikit-learn` in conjunction with a custom AI Engine to ensure structural privacy and realism.
- **Docker & Docker Compose**: Fully containerized environment for seamless air-gapped deployment compatibility.

---

## Project Structure

- `src/`, `public/`, `index.html`: The React/Vite frontend.
- `main.py`: The FastAPI application and core API endpoints.
- `ai_engine.py`: The foundational algorithmic engine for evaluating and synthesizing datasets.
  > **Note**: The core algorithm and AI model will be linked to the `synthetic-data-ai-engine` repository.
- `celery_app.py`: Task definitions and Celery worker configurations.
- `docker-compose.yml`: Handles orchestrating the API, Celery worker, and Redis cluster.
- `requirements.txt` / `package.json`: Dependency manifests for backend and frontend.

---

## Getting Started

### 1. Running the Backend Stack
Ensure you have Docker Desktop (or the Docker daemon) running locally.
From the project root:

```bash
docker-compose up --build
```
This will automatically spin up:
- **Redis (`well7_redis`)** on port 6379 
- **FastAPI (`well7_api`)** on `http://localhost:8000`
- **Celery Worker (`well7_celery_worker`)**

*Swagger API docs can be viewed immediately at `http://localhost:8000/docs`.*

### 2. Running the Frontend
In a new terminal window, also at the project root:

```bash
# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

---

## Core API Flow

The platform coordinates workloads through four primary REST endpoints:

1. **`POST /api/v1/ingest`**: Securely uplods the raw CSV to storage (mock S3 locally) and computes the necessary structural profile.
2. **`POST /api/v1/train`**: Submits an asynchronous Celery task to train the generative AI model on the ingested dataset and returns a `job_id`. 
3. **`POST /api/v1/generate`**: Submits a generative task, using a specific `model_id` to synthesize a requested number of mock rows.
4. **`GET /api/v1/jobs/{job_id}`**: Polling endpoint utilized by the real-time front-end dashboard to track the progress and retrieve final results upon `'SUCCESS'`.
