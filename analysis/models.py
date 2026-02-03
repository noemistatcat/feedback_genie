"""Pydantic models for request/response schemas."""

from pydantic import BaseModel, Field
from typing import List, Optional


class AnalyzeRequest(BaseModel):
    """Request model for analysis endpoint."""

    responses: List[str] = Field(..., description="List of text responses to analyze")
    method: str = Field(
        default="auto",
        description="Analysis method: 'auto', 'pure_llm', or 'hybrid'"
    )
    context: Optional[str] = Field(
        default=None,
        description="Optional context about the survey/responses"
    )


class Theme(BaseModel):
    """A identified theme with assigned responses."""

    id: str
    name: str
    description: str
    response_indices: List[int]
    representative_quotes: List[str]
    confidence: float
    count: int
    percentage: float


class AnalyzeResponse(BaseModel):
    """Response model for analysis results."""

    themes: List[Theme]
    total_responses: int
    assigned_count: int
    unassigned_indices: List[int]
    coverage_percentage: float
    processing_time_ms: int
    method_used: str
    model_used: str = "gemini-1.5-flash-latest"


class ProgressUpdate(BaseModel):
    """Progress update model."""

    stage: str
    percent: int
    message: Optional[str] = None
