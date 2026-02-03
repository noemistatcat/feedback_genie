"""Main analysis pipeline with orchestration and progress tracking."""

import time
from typing import List, Optional, Callable
import google.generativeai as genai

from .config import config
from .models import AnalyzeResponse, Theme
from .embeddings import generate_embeddings
from .clustering import (
    cluster_responses,
    find_optimal_clusters,
    calculate_cluster_confidence,
    assign_multi_themes,
    get_theme_to_responses_mapping
)
from .preprocessing import preprocess_responses
from .labeling import label_all_clusters


# Configure Gemini
if config.GOOGLE_API_KEY:
    genai.configure(api_key=config.GOOGLE_API_KEY)


async def pure_llm_analysis(
    responses: List[str],
    context: Optional[str] = None
) -> AnalyzeResponse:
    """
    Pure LLM analysis (existing TypeScript method for small datasets).

    Args:
        responses: List of response texts
        context: Optional context

    Returns:
        AnalyzeResponse object
    """
    start_time = time.time()

    # Create prompt
    context_section = f"Context: {context}\n\n" if context else ""
    prompt = f"""{context_section}Analyze these {len(responses)} survey responses and identify 4-8 distinct themes.

For each theme provide:
- id: "theme_1", "theme_2", etc
- name: 2-5 word description
- description: 1 sentence explanation
- responseIndices: array of response indices (0-based)
- representativeQuotes: 3-5 actual quotes
- confidence: 0-1 score

Requirements:
- Responses can belong to MULTIPLE themes if they cover multiple topics
- Ensure every response is assigned to at least one theme (100% coverage)
- Themes must be specific and distinct
- Use actual quotes, not paraphrased

Responses:
{chr(10).join(f'[{i}] {r}' for i, r in enumerate(responses))}

Return ONLY a JSON object with a "themes" array."""

    try:
        model = genai.GenerativeModel(config.LLM_MODEL)
        response = await asyncio.to_thread(
            model.generate_content,
            prompt
        )

        # Parse response
        import json
        text = response.text.strip()

        # Remove markdown if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        data = json.loads(text)

        # Convert to Theme objects
        themes = []
        for theme_data in data.get('themes', []):
            themes.append(Theme(
                id=theme_data.get('id', f"theme_{len(themes)}"),
                name=theme_data.get('name', 'Unnamed Theme'),
                description=theme_data.get('description', ''),
                response_indices=theme_data.get('responseIndices', []),
                representative_quotes=theme_data.get('representativeQuotes', []),
                confidence=theme_data.get('confidence', 0.8),
                count=len(theme_data.get('responseIndices', [])),
                percentage=(len(theme_data.get('responseIndices', [])) / len(responses)) * 100
            ))

        # Calculate coverage
        assigned_indices = set()
        for theme in themes:
            assigned_indices.update(theme.response_indices)

        unassigned = [i for i in range(len(responses)) if i not in assigned_indices]

        processing_time = int((time.time() - start_time) * 1000)

        return AnalyzeResponse(
            themes=themes,
            total_responses=len(responses),
            assigned_count=len(assigned_indices),
            unassigned_indices=unassigned,
            coverage_percentage=(len(assigned_indices) / len(responses)) * 100,
            processing_time_ms=processing_time,
            method_used="pure_llm"
        )

    except Exception as e:
        print(f"Pure LLM analysis error: {e}")
        raise


async def hybrid_analysis(
    responses: List[str],
    on_progress: Optional[Callable[[str, int], None]] = None
) -> AnalyzeResponse:
    """
    Hybrid analysis with embeddings + clustering + LLM labeling.

    Args:
        responses: List of response texts
        on_progress: Optional progress callback(stage, percent)

    Returns:
        AnalyzeResponse object
    """
    start_time = time.time()

    def emit(stage: str, percent: int):
        if on_progress:
            on_progress(stage, percent)

    emit("Starting analysis", 0)

    # Step 1: Preprocess long texts
    emit("Preprocessing long texts", 10)
    processed = await preprocess_responses(responses)

    # Step 2: Generate embeddings
    emit("Generating embeddings", 30)
    embeddings = await generate_embeddings(processed)

    # Step 3: Cluster
    emit("Finding optimal clusters", 60)
    k, silhouette = find_optimal_clusters(embeddings)
    emit(f"Clustering into {k} groups", 65)
    labels, centroids = cluster_responses(embeddings, k)

    # Calculate cluster confidences
    confidences = calculate_cluster_confidence(embeddings, labels, centroids)

    # Step 3.5: Multi-theme assignment
    emit("Assigning responses to themes", 75)
    multi_assignments = assign_multi_themes(embeddings, centroids)
    theme_to_responses = get_theme_to_responses_mapping(multi_assignments, k)

    # Step 4: Label clusters
    emit("Labeling themes", 80)
    themes = await label_all_clusters(
        labels, responses, embeddings, centroids, confidences,
        theme_to_responses=theme_to_responses
    )

    # Calculate final stats (note: with multi-theme, same response can be in multiple themes)
    unique_responses = set()
    for theme in themes:
        unique_responses.update(theme.response_indices)
    assigned_count = len(unique_responses)

    processing_time = int((time.time() - start_time) * 1000)

    emit("Complete", 100)

    return AnalyzeResponse(
        themes=themes,
        total_responses=len(responses),
        assigned_count=assigned_count,
        unassigned_indices=[],  # Clustering assigns all
        coverage_percentage=100.0,
        processing_time_ms=processing_time,
        method_used="hybrid"
    )


async def analyze_responses(
    responses: List[str],
    method: str = "auto",
    context: Optional[str] = None,
    on_progress: Optional[Callable[[str, int], None]] = None
) -> AnalyzeResponse:
    """
    Main analysis entry point with smart routing.

    Args:
        responses: List of response texts
        method: "auto", "pure_llm", or "hybrid"
        context: Optional context
        on_progress: Optional progress callback

    Returns:
        AnalyzeResponse object
    """
    # Smart routing
    if method == "auto":
        avg_len = sum(len(r) for r in responses) / len(responses) if responses else 0
        method = "hybrid" if (
            len(responses) > config.HYBRID_THRESHOLD_COUNT or
            avg_len > config.HYBRID_THRESHOLD_AVG_LENGTH
        ) else "pure_llm"

    if method == "pure_llm":
        return await pure_llm_analysis(responses, context)
    else:
        return await hybrid_analysis(responses, on_progress)


# Need to import asyncio for pure_llm_analysis
import asyncio
