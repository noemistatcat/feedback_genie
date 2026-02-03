"""Chunking strategy for very large datasets."""

import numpy as np
from typing import List, Optional, Callable

from .config import config
from .models import AnalyzeResponse, Theme
from .pipeline import analyze_responses as analyze_chunk
from .embeddings import generate_theme_embeddings
from .clustering import cluster_responses


async def merge_similar_themes(
    themes: List[Theme],
    labels: np.ndarray
) -> List[Theme]:
    """
    Merge themes that clustered together.

    Args:
        themes: List of themes from different chunks
        labels: Cluster labels for themes

    Returns:
        List of merged themes
    """
    merged = {}

    for theme, label in zip(themes, labels):
        label = int(label)
        if label not in merged:
            merged[label] = {
                'indices': [],
                'quotes': [],
                'names': [],
                'descriptions': [],
                'confidences': []
            }

        merged[label]['indices'].extend(theme.response_indices)
        merged[label]['quotes'].extend(theme.representative_quotes[:2])
        merged[label]['names'].append(theme.name)
        merged[label]['descriptions'].append(theme.description)
        merged[label]['confidences'].append(theme.confidence)

    # Generate final themes
    final_themes = []
    for label, data in merged.items():
        # Use most common name or first one
        name = data['names'][0]

        # Use first description or could synthesize
        description = data['descriptions'][0]

        # Average confidence
        avg_confidence = sum(data['confidences']) / len(data['confidences'])

        final_themes.append(Theme(
            id=f"theme_{label}",
            name=name,
            description=description,
            response_indices=sorted(data['indices']),
            representative_quotes=data['quotes'][:5],
            confidence=avg_confidence,
            count=len(data['indices']),
            percentage=0.0  # Will calculate after
        ))

    # Calculate percentages
    total_responses = sum(theme.count for theme in final_themes)
    for theme in final_themes:
        theme.percentage = (theme.count / total_responses) * 100 if total_responses > 0 else 0.0

    return final_themes


async def analyze_large_dataset(
    responses: List[str],
    on_progress: Optional[Callable[[str, int], None]] = None
) -> AnalyzeResponse:
    """
    Chunk-based analysis for very large datasets.

    Args:
        responses: List of response texts (>5000)
        on_progress: Optional progress callback

    Returns:
        AnalyzeResponse object
    """
    chunk_size = config.CHUNK_SIZE

    # Split into chunks
    chunks = [
        responses[i:i + chunk_size]
        for i in range(0, len(responses), chunk_size)
    ]

    if on_progress:
        on_progress(f"Processing {len(chunks)} chunks", 0)

    # Step 1: Process chunks independently
    chunk_results = []
    for i, chunk in enumerate(chunks):
        if on_progress:
            percent = int((i / len(chunks)) * 70)  # 0-70%
            on_progress(f"Analyzing chunk {i+1}/{len(chunks)}", percent)

        result = await analyze_chunk(chunk, method="hybrid")

        # Offset indices to global positions
        offset = i * chunk_size
        for theme in result.themes:
            theme.response_indices = [idx + offset for idx in theme.response_indices]

        chunk_results.append(result)

    if on_progress:
        on_progress("Merging themes across chunks", 75)

    # Step 2: Meta-clustering - cluster the chunk themes together
    all_chunk_themes = [t for r in chunk_results for t in r.themes]

    # Embed theme descriptions
    theme_descriptions = [
        f"{t.name}: {t.description}"
        for t in all_chunk_themes
    ]
    theme_embeddings = await generate_theme_embeddings(theme_descriptions)

    # Cluster themes into final groups
    final_k = min(12, len(all_chunk_themes) // 2)
    labels, _ = cluster_responses(theme_embeddings, k=final_k)

    if on_progress:
        on_progress("Merging similar themes", 90)

    # Step 3: Merge themes with same label
    final_themes = await merge_similar_themes(all_chunk_themes, labels)

    total_processing_time = sum(r.processing_time_ms for r in chunk_results)

    if on_progress:
        on_progress("Complete", 100)

    return AnalyzeResponse(
        themes=final_themes,
        total_responses=len(responses),
        assigned_count=sum(theme.count for theme in final_themes),
        unassigned_indices=[],
        coverage_percentage=100.0,
        processing_time_ms=total_processing_time,
        method_used="hybrid_chunked"
    )
