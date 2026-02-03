"""FastAPI application for analysis backend."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from .models import AnalyzeRequest, AnalyzeResponse
from .pipeline import analyze_responses
from .chunking import analyze_large_dataset
from .config import config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Theme Genie Analysis API",
    description="AI-powered theme analysis for survey responses and reviews",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Theme Genie Analysis API",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "api_key_configured": config.GOOGLE_API_KEY is not None
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Analyze survey responses and identify themes.

    Args:
        request: AnalyzeRequest with responses and method

    Returns:
        AnalyzeResponse with identified themes
    """
    try:
        # Validate
        if not request.responses:
            raise HTTPException(status_code=400, detail="No responses provided")

        if len(request.responses) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum 10 responses required, got {len(request.responses)}"
            )

        if len(request.responses) > 10000:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum 10,000 responses allowed, got {len(request.responses)}"
            )

        logger.info(f"Analyzing {len(request.responses)} responses with method={request.method}")

        # Choose analysis method
        if len(request.responses) > 5000:
            # Use chunked analysis for very large datasets
            logger.info("Using chunked hybrid analysis for large dataset")
            result = await analyze_large_dataset(request.responses)
        else:
            # Use regular analysis
            result = await analyze_responses(
                responses=request.responses,
                method=request.method,
                context=request.context
            )

        logger.info(
            f"Analysis complete: {len(result.themes)} themes, "
            f"{result.coverage_percentage:.1f}% coverage, "
            f"{result.processing_time_ms}ms"
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


# For development/testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
