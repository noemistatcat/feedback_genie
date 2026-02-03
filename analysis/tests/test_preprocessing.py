"""Tests for preprocessing module."""

import pytest
from unittest.mock import AsyncMock
from analysis.preprocessing import extract_key_points, preprocess_responses


@pytest.mark.asyncio
async def test_extract_key_points(mocker):
    """Test key point extraction from long text."""
    mock_response = MagicMock()
    mock_response.text = "Key point 1. Key point 2. Key point 3."

    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    mocker.patch(
        'analysis.preprocessing.genai.GenerativeModel',
        return_value=mock_model
    )

    long_text = "This is a very long review. " * 100
    result = await extract_key_points(long_text)

    assert isinstance(result, str)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_preprocess_responses_short_texts(sample_responses):
    """Test preprocessing with short texts (no extraction needed)."""
    result = await preprocess_responses(sample_responses, max_length=1000)

    assert len(result) == len(sample_responses)
    assert result == sample_responses  # Should be unchanged


@pytest.mark.asyncio
async def test_preprocess_responses_long_texts(mocker, long_responses):
    """Test preprocessing with mix of short and long texts."""
    mock_response = MagicMock()
    mock_response.text = "Extracted key points"

    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    mocker.patch(
        'analysis.preprocessing.genai.GenerativeModel',
        return_value=mock_model
    )

    result = await preprocess_responses(long_responses, max_length=50)

    assert len(result) == len(long_responses)
    assert result[0] == long_responses[0]  # Short one unchanged
    assert result[1] != long_responses[1]  # Long one extracted


@pytest.mark.asyncio
async def test_preprocess_responses_progress(mocker):
    """Test progress callback."""
    mock_response = MagicMock()
    mock_response.text = "Extracted"

    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    mocker.patch(
        'analysis.preprocessing.genai.GenerativeModel',
        return_value=mock_model
    )

    progress_calls = []

    def on_progress(current, total):
        progress_calls.append((current, total))

    long_texts = ["x" * 1000 for _ in range(5)]
    await preprocess_responses(long_texts, max_length=100, on_progress=on_progress)

    assert len(progress_calls) > 0


from unittest.mock import MagicMock
