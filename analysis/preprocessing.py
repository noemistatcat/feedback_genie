"""Preprocessing with parallel long text extraction."""

import asyncio
from typing import List, Optional, Callable
import google.generativeai as genai

from .config import config


async def extract_key_points(text: str) -> str:
    """
    Extract key points from a long text using LLM.

    Args:
        text: Long text to extract key points from

    Returns:
        Condensed version with key points
    """
    prompt = f"""Extract 3-5 key points from this review/response. Be concise and preserve the main ideas.

Text:
{text}

Return only the key points as a brief summary (2-3 sentences max)."""

    try:
        model = genai.GenerativeModel(config.LLM_MODEL)
        response = await asyncio.to_thread(
            model.generate_content,
            prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error extracting key points: {e}")
        # Fallback: just truncate
        return text[:config.LONG_TEXT_THRESHOLD] + "..."


async def preprocess_responses(
    responses: List[str],
    max_length: Optional[int] = None,
    on_progress: Optional[Callable[[int, int], None]] = None
) -> List[str]:
    """
    Preprocess responses with parallel extraction for long texts.

    Args:
        responses: List of response texts
        max_length: Maximum length threshold (default from config)
        on_progress: Optional callback(current, total) for progress

    Returns:
        List of processed responses
    """
    if max_length is None:
        max_length = config.LONG_TEXT_THRESHOLD

    # Identify which responses need extraction
    tasks = []
    indices_needing_extraction = []

    for i, r in enumerate(responses):
        if len(r) > max_length:
            indices_needing_extraction.append(i)
            tasks.append(r)

    # If no long texts, return as-is
    if not tasks:
        return list(responses)

    # Skip preprocessing if less than 10% are long (not worth the API calls)
    if len(tasks) / len(responses) < 0.1:
        return list(responses)

    # Process long texts in parallel
    semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_EXTRACTIONS)

    async def limited_extract(idx: int, text: str):
        async with semaphore:
            result = await extract_key_points(text)
            if on_progress:
                on_progress(idx + 1, len(tasks))
            return result

    extracted = await asyncio.gather(*[
        limited_extract(idx, text)
        for idx, text in enumerate(tasks)
    ])

    # Build result list
    processed = list(responses)  # Copy
    for idx, extracted_text in zip(indices_needing_extraction, extracted):
        processed[idx] = extracted_text

    return processed
