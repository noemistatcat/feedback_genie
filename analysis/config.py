"""Configuration for analysis backend."""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration settings."""

    # API Keys
    GOOGLE_API_KEY = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")

    # Model names
    EMBEDDING_MODEL = "models/gemini-embedding-001"
    LLM_MODEL = "models/gemini-3-flash-preview"

    # Clustering parameters
    MIN_CLUSTERS = 4
    MAX_CLUSTERS = 8  # Reduced from 12 for faster processing

    # Concurrency limits
    EMBEDDING_BATCH_SIZE = 100
    MAX_CONCURRENT_EMBEDDING_BATCHES = 5
    MAX_CONCURRENT_EXTRACTIONS = 10
    MAX_CONCURRENT_LABELS = 12

    # Chunking
    CHUNK_SIZE = 2000

    # Preprocessing
    LONG_TEXT_THRESHOLD = 600  # Increased from 400 to skip more texts

    # Smart routing
    HYBRID_THRESHOLD_COUNT = 200
    HYBRID_THRESHOLD_AVG_LENGTH = 300

    # Multi-theme assignment
    MULTI_THEME_RELATIVE_FACTOR = 0.95  # Response must be within 95% of best centroid similarity
    MAX_THEMES_PER_RESPONSE = 3  # Hard cap on themes per response

    # Performance
    MAX_LABELING_RETRIES = 1  # Reduced retries for faster processing


# Singleton instance
config = Config()
