"""Tests for clustering module."""

import pytest
import numpy as np
from analysis.clustering import (
    find_optimal_clusters,
    cluster_responses,
    calculate_cluster_confidence
)


def test_find_optimal_clusters(sample_embeddings):
    """Test finding optimal number of clusters."""
    k, score = find_optimal_clusters(sample_embeddings, min_k=2, max_k=5)

    assert 2 <= k <= 5
    assert -1 <= score <= 1  # Silhouette score range


def test_cluster_responses(sample_embeddings):
    """Test clustering responses."""
    labels, centroids = cluster_responses(sample_embeddings, k=3)

    assert len(labels) == len(sample_embeddings)
    assert centroids.shape[0] == 3
    assert centroids.shape[1] == sample_embeddings.shape[1]
    assert len(np.unique(labels)) == 3


def test_cluster_responses_auto_k(sample_embeddings):
    """Test clustering with automatic k selection."""
    labels, centroids = cluster_responses(sample_embeddings, k=None)

    assert len(labels) == len(sample_embeddings)
    assert centroids.shape[0] >= 2  # Should find at least 2 clusters


def test_calculate_cluster_confidence(sample_embeddings):
    """Test confidence calculation."""
    labels, centroids = cluster_responses(sample_embeddings, k=3)
    confidences = calculate_cluster_confidence(sample_embeddings, labels, centroids)

    assert len(confidences) == 3
    assert all(0.0 <= c <= 1.0 for c in confidences)


def test_cluster_edge_cases():
    """Test clustering with edge cases."""
    # Very small dataset
    small_embeddings = np.random.randn(5, 10)
    labels, centroids = cluster_responses(small_embeddings, k=2)
    assert len(labels) == 5

    # Single cluster
    single_embeddings = np.random.randn(10, 10)
    labels, centroids = cluster_responses(single_embeddings, k=1)
    assert len(np.unique(labels)) == 1
