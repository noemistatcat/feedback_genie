"""Tests for the main pipeline."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from analysis.pipeline import analyze_responses, pure_llm_analysis, hybrid_analysis
from analysis.models import AnalyzeResponse


@pytest.mark.asyncio
async def test_analyze_responses_auto_routing_small(mocker, sample_responses):
    """Test auto routing for small dataset (should use pure_llm)."""
    mock_result = AnalyzeResponse(
        themes=[],
        total_responses=len(sample_responses),
        assigned_count=len(sample_responses),
        unassigned_indices=[],
        coverage_percentage=100.0,
        processing_time_ms=1000,
        method_used="pure_llm"
    )

    mock_pure = mocker.patch(
        'analysis.pipeline.pure_llm_analysis',
        return_value=mock_result
    )

    result = await analyze_responses(sample_responses, method="auto")

    assert result.method_used == "pure_llm"
    mock_pure.assert_called_once()


@pytest.mark.asyncio
async def test_analyze_responses_auto_routing_large(mocker):
    """Test auto routing for large dataset (should use hybrid)."""
    large_responses = [f"Response {i}" for i in range(300)]

    mock_result = AnalyzeResponse(
        themes=[],
        total_responses=len(large_responses),
        assigned_count=len(large_responses),
        unassigned_indices=[],
        coverage_percentage=100.0,
        processing_time_ms=5000,
        method_used="hybrid"
    )

    mock_hybrid = mocker.patch(
        'analysis.pipeline.hybrid_analysis',
        return_value=mock_result
    )

    result = await analyze_responses(large_responses, method="auto")

    assert result.method_used == "hybrid"
    mock_hybrid.assert_called_once()


@pytest.mark.asyncio
async def test_analyze_responses_explicit_method(mocker, sample_responses):
    """Test explicit method selection."""
    mock_result = AnalyzeResponse(
        themes=[],
        total_responses=len(sample_responses),
        assigned_count=len(sample_responses),
        unassigned_indices=[],
        coverage_percentage=100.0,
        processing_time_ms=1000,
        method_used="hybrid"
    )

    mock_hybrid = mocker.patch(
        'analysis.pipeline.hybrid_analysis',
        return_value=mock_result
    )

    result = await analyze_responses(sample_responses, method="hybrid")

    assert result.method_used == "hybrid"
    mock_hybrid.assert_called_once()


@pytest.mark.asyncio
async def test_progress_callback(mocker, sample_responses):
    """Test progress callback functionality."""
    import numpy as np

    progress_updates = []

    def on_progress(stage, percent):
        progress_updates.append((stage, percent))

    # Create mock numpy arrays for embeddings and centroids
    n_samples = len(sample_responses)
    n_clusters = 3
    mock_embeddings = np.random.rand(n_samples, 768)
    mock_centroids = np.random.rand(n_clusters, 768)
    mock_labels = np.array([0, 1, 2, 0, 1, 2, 0, 1, 2, 0][:n_samples])

    # Mock the necessary functions
    mocker.patch('analysis.pipeline.preprocess_responses', return_value=sample_responses)
    mocker.patch('analysis.pipeline.generate_embeddings', return_value=mock_embeddings)
    mocker.patch('analysis.pipeline.find_optimal_clusters', return_value=(n_clusters, 0.5))
    mocker.patch('analysis.pipeline.cluster_responses', return_value=(mock_labels, mock_centroids))
    mocker.patch('analysis.pipeline.calculate_cluster_confidence', return_value=np.array([0.8, 0.8, 0.8]))
    mocker.patch('analysis.pipeline.assign_multi_themes', return_value=[[0], [1], [2], [0], [1], [2], [0], [1], [2], [0]][:n_samples])
    mocker.patch('analysis.pipeline.get_theme_to_responses_mapping', return_value={0: [0, 3, 6, 9], 1: [1, 4, 7], 2: [2, 5, 8]})
    mocker.patch('analysis.pipeline.label_all_clusters', return_value=[])

    await hybrid_analysis(sample_responses, on_progress=on_progress)

    assert len(progress_updates) > 0
    assert progress_updates[0][1] == 0  # Starts at 0%
    assert progress_updates[-1][1] == 100  # Ends at 100%
