"""Embedding generation with parallel batching."""

import asyncio
import numpy as np
from typing import List, Callable, Optional
import google.generativeai as genai

from .config import config


# Configure Gemini
if config.GOOGLE_API_KEY:
    genai.configure(api_key=config.GOOGLE_API_KEY)


async def embed_batch(texts: List[str], task_type: str = "CLUSTERING") -> List[List[float]]:
    """
    Embed a single batch of texts.

    Args:
        texts: List of texts to embed (max 100)
        task_type: Task type for embedding model

    Returns:
        List of embedding vectors
    """
    try:
        result = await asyncio.to_thread(
            genai.embed_content,
            model=config.EMBEDDING_MODEL,
            content=texts,
            task_type=task_type
        )
        return result['embedding']
    except Exception as e:
        # Fallback: embed individually if batch fails
        print(f"Batch embedding failed: {e}, trying individually...")
        embeddings = []
        for text in texts:
            result = await asyncio.to_thread(
                genai.embed_content,
                model=config.EMBEDDING_MODEL,
                content=text,
                task_type=task_type
            )
            embeddings.append(result['embedding'])
        return embeddings


async def generate_embeddings(
    texts: List[str],
    on_progress: Optional[Callable[[int, int], None]] = None
) -> np.ndarray:
    """
    Generate embeddings with parallel batching.

    Args:
        texts: List of texts to embed
        on_progress: Optional callback(current, total) for progress updates

    Returns:
        Numpy array of shape (n_texts, embedding_dim)
    """
    if not texts:
        return np.array([])

    # Split into batches
    batch_size = config.EMBEDDING_BATCH_SIZE
    batches = [
        texts[i:i + batch_size]
        for i in range(0, len(texts), batch_size)
    ]

    # Process batches in parallel with limited concurrency
    semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_EMBEDDING_BATCHES)

    async def limited_embed(batch_idx: int, batch: List[str]):
        async with semaphore:
            result = await embed_batch(batch)
            if on_progress:
                completed = min((batch_idx + 1) * batch_size, len(texts))
                on_progress(completed, len(texts))
            return result

    # Run all batches concurrently
    results = await asyncio.gather(*[
        limited_embed(idx, batch)
        for idx, batch in enumerate(batches)
    ])

    # Flatten results
    all_embeddings = []
    for batch_result in results:
        if isinstance(batch_result[0], list):
            # Multiple embeddings
            all_embeddings.extend(batch_result)
        else:
            # Single embedding
            all_embeddings.append(batch_result)

    return np.array(all_embeddings)


async def generate_theme_embeddings(theme_descriptions: List[str]) -> np.ndarray:
    """
    Generate embeddings for theme descriptions.

    Args:
        theme_descriptions: List of theme description strings

    Returns:
        Numpy array of embeddings
    """
    return await generate_embeddings(theme_descriptions)
