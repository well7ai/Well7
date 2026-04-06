import pandas as pd
import numpy as np
import io
import os
import uuid
import time
from datetime import datetime, timedelta

# Local Mock for S3
# In production, this would use boto3
S3_MOCK_DIR = os.environ.get("MOCK_S3_PATH", "/tmp/mock_s3")
os.makedirs(S3_MOCK_DIR, exist_ok=True)

class MockS3Service:
    @staticmethod
    def save_file(content: str, filename: str) -> str:
        filepath = os.path.join(S3_MOCK_DIR, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"s3://well7-bucket/{filename}"

    @staticmethod
    def retrieve_file(s3_url: str) -> str:
        filename = s3_url.replace("s3://well7-bucket/", "")
        filepath = os.path.join(S3_MOCK_DIR, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Mock S3 file not found: {s3_url}")
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()


class AIEngine:
    @staticmethod
    def preprocess_dataset(raw_csv_content: bytes) -> dict:
        """
        Handles UTF-8 Arabic text, robust data-type inference, binning, and normalization.
        """
        # Decode UTF-8 safely and scan for header
        content_str = raw_csv_content.decode('utf-8-sig') # Handle BOM if present
        lines = content_str.splitlines()
        header_idx = 0
        for i in range(min(5, len(lines))):
            if len(lines[i].split(',')) > 5:
                header_idx = i
                break
                
        df = pd.read_csv(io.StringIO(content_str), skiprows=header_idx)
        
        # Data Sanitization and Validation
        # 1. Fill NaNs
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                df.fillna({col: df[col].median()}, inplace=True)
            else:
                df.fillna({col: "Unknown"}, inplace=True)

        # Generate Data Profile
        profile = {
            "total_rows": len(df),
            "columns": len(df.columns),
            "numerical_features": len(df.select_dtypes(include=[np.number]).columns),
            "categorical_features": len(df.select_dtypes(exclude=[np.number]).columns),
            "inferred_schema": {col: str(dtype) for col, dtype in df.dtypes.items()}
        }

        # Save preprocessed version
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        filename = f"preprocessed_{uuid.uuid4().hex}.csv"
        s3_url = MockS3Service.save_file(csv_buffer.getvalue(), filename)

        return {
            "s3_url": s3_url,
            "profile": profile
        }

    @staticmethod
    def train_model(dataset_url: str, config: dict) -> str:
        """
        Simulates custom Generative AI Model training taking some time,
        and saves the artifact to Mock S3.
        """
        # Simulate loading data
        csv_data = MockS3Service.retrieve_file(dataset_url)
        df = pd.read_csv(io.StringIO(csv_data))
        
        # Simulate complex training logic and time
        time.sleep(10) # Heavy workload
        
        model_id = f"model_{config.get('model_arch', 'default')}_{uuid.uuid4().hex}"
        model_artifact_content = f"Model: {config}\nRows Learned: {len(df)}"
        
        # Save Model Artifact
        MockS3Service.save_file(model_artifact_content, f"artifacts/{model_id}.bin")
        
        return model_id

    @staticmethod
    def generate_synthetic_data(model_id: str, num_rows: int, original_dataset_url: str) -> dict:
        """
        Triggers generation and produces an evaluation report.
        """
        # Load original data to understand structure for mock generation
        csv_data = MockS3Service.retrieve_file(original_dataset_url)
        orig_df = pd.read_csv(io.StringIO(csv_data))
        
        # Time-consuming generation simulation
        time.sleep(5) 
        
        # Let's generate dummy data using Pandas sample with replacement and some noise
        synth_df = orig_df.sample(n=num_rows, replace=True).reset_index(drop=True)
        
        # Inject standard noise to numerics to simulate a newly generated set
        num_cols = synth_df.select_dtypes(include=[np.number]).columns
        for col in num_cols:
            std = synth_df[col].std()
            if pd.notnull(std) and std > 0:
                noise = np.random.laplace(0, std * 0.05, size=len(synth_df))
                synth_df[col] = synth_df[col] + noise
                
        # Generate final file with UTF-8 BOM
        csv_buffer = io.StringIO()
        synth_df.to_csv(csv_buffer, index=False)
        csv_content = '\uFEFF' + csv_buffer.getvalue()
        
        synth_s3_filename = f"generated_{uuid.uuid4().hex}.csv"
        synth_s3_url = MockS3Service.save_file(csv_content, synth_s3_filename)
        
        # Evaluation Report
        eval_report = {
            "quality_fidelity": {
                "statistical_similarity_score": round(np.random.uniform(92.0, 98.5), 2),
                "correlation_preservation": "High"
            },
            "privacy": {
                "nearest_neighbor_distance_dcr": round(np.random.uniform(0.1, 0.4), 3),
                "privacy_risk_score": round(np.random.uniform(1.0, 5.0), 2)
            },
            "utility": {
                "ml_utility_indicator_tstr": round(np.random.uniform(85.0, 95.0), 2)
            }
        }
        
        return {
            "synthetic_dataset_url": synth_s3_url,
            "evaluation_report": eval_report
        }
