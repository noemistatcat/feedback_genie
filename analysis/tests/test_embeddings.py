"""Tests for embeddings module."""

import pytest
import numpy as np
from unittest.mock import AsyncMock, MagicMock
from analysis.embeddings import embed_batch, generate_embeddings


@pytest.mark.asyncio
async def test_embed_batch(mocker):
    """Test embedding a batch of texts."""
    # Mock the genai.embed_content function
    mock_result = {
        'embedding': [[0.1] * 768, [0.2] * 768, [0.3] * 768]
    }

    mock_embed = mocker.patch(
        'analysis.embeddings.genai.embed_content',
        return_value=mock_result
    )

    texts = ["text1", "text2", "text3"]
    result = await embed_batch(texts)

    assert len(result) == 3
    assert len(result[0]) == 768
    mock_embed.assert_called_once()


@pytest.mark.asyncio
async def test_generate_embeddings(mocker):
    """Test generating embeddings with batching."""
    # Mock embed_batch
    async def mock_batch(texts, task_type="CLUSTERING"):
        return [[0.1] * 768] * len(texts)

    mocker.patch('analysis.embeddings.embed_batch', side_effect=mock_batch)

    texts = ["text1", "text2", "text3"]
    result = await generate_embeddings(texts)

    assert isinstance(result, np.ndarray)
    assert result.shape == (3, 768)


@pytest.mark.asyncio
async def test_generate_embeddings_large_dataset(mocker):
    """Test embeddings with large dataset requiring multiple batches."""
    async def mock_batch(texts, task_type="CLUSTERING"):
        return [[0.1] * 768] * len(texts)

    mocker.patch('analysis.embeddings.embed_batch', side_effect=mock_batch)

    # Create 250 texts (should require 3 batches of 100)
    texts = [f"text{i}" for i in range(250)]
    result = await generate_embeddings(texts)

    assert isinstance(result, np.ndarray)
    assert result.shape == (250, 768)


@pytest.mark.asyncio
async def test_generate_embeddings_empty():
    """Test with empty input."""
    result = await generate_embeddings([])
    assert isinstance(result, np.ndarray)
    assert result.shape == (0,)


@pytest.mark.asyncio
async def test_generate_embeddings_progress(mocker):
    """Test progress callback."""
    async def mock_batch(texts, task_type="CLUSTERING"):
        return [[0.1] * 768] * len(texts)

    mocker.patch('analysis.embeddings.embed_batch', side_effect=mock_batch)

    progress_calls = []

    def on_progress(current, total):
        progress_calls.append((current, total))

    texts = [f"text{i}" for i in range(150)]
    await generate_embeddings(texts, on_progress=on_progress)

    assert len(progress_calls) > 0
    assert progress_calls[-1][0] == 150  # Final progress
    assert progress_calls[-1][1] == 150
