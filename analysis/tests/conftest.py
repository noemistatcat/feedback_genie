"""Pytest configuration and fixtures."""

import pytest
import numpy as np


@pytest.fixture
def sample_responses():
    """Sample survey responses for testing."""
    return [
        "I love the coffee, it's amazing",
        "Great coffee and friendly staff",
        "The espresso is excellent",
        "Poor service, had to wait too long",
        "Service is terrible, very slow",
        "Staff needs better training",
        "Coffee is too expensive for the quality",
        "Overpriced and not worth it",
        "Good value for money",
        "Fair prices for good coffee",
        "Love the cozy atmosphere",
        "Nice ambiance and decor",
    ]


@pytest.fixture
def long_responses():
    """Long text responses for preprocessing tests."""
    return [
        "Short response",
        "This is a very long response that goes on and on with lots of details about the product, including specific features, pricing concerns, quality issues, customer service experiences, and overall satisfaction levels. " * 5
    ]


@pytest.fixture
def sample_embeddings():
    """Sample embeddings for clustering tests."""
    np.random.seed(42)
    # Create 3 clusters of embeddings
    cluster1 = np.random.randn(4, 768) + np.array([1, 0] + [0]*766)
    cluster2 = np.random.randn(4, 768) + np.array([0, 1] + [0]*766)
    cluster3 = np.random.randn(4, 768) + np.array([-1, -1] + [0]*766)
    return np.vstack([cluster1, cluster2, cluster3])


@pytest.fixture
def high_similarity_embeddings():
    """
    Embeddings with high baseline cosine similarity, mimicking real Gemini embeddings.

    Creates embeddings where responses naturally have high similarity (0.7-0.9+)
    to multiple centroids, similar to what happens in real 768-dimensional
    Gemini embedding space.
    """
    np.random.seed(42)

    # Create a shared base vector (normalized)
    base_vector = np.random.randn(768)
    base_vector = base_vector / np.linalg.norm(base_vector)

    # Create 4 clusters with small perturbations from the base
    # This creates high baseline similarity between all embeddings
    cluster1 = []
    cluster2 = []
    cluster3 = []
    cluster4 = []

    for i in range(3):
        # Cluster 1: perturbation in direction [1, 0, 0, ...]
        perturbation = np.random.randn(768) * 0.1
        perturbation[:10] += np.array([0.3, 0.1, 0.1] + [0]*7)
        emb = base_vector + perturbation
        cluster1.append(emb / np.linalg.norm(emb))

        # Cluster 2: perturbation in direction [0, 1, 0, ...]
        perturbation = np.random.randn(768) * 0.1
        perturbation[:10] += np.array([0.1, 0.3, 0.1] + [0]*7)
        emb = base_vector + perturbation
        cluster2.append(emb / np.linalg.norm(emb))

        # Cluster 3: perturbation in direction [0, 0, 1, ...]
        perturbation = np.random.randn(768) * 0.1
        perturbation[:10] += np.array([0.1, 0.1, 0.3] + [0]*7)
        emb = base_vector + perturbation
        cluster3.append(emb / np.linalg.norm(emb))

        # Cluster 4: perturbation in direction [-1, -1, -1, ...]
        perturbation = np.random.randn(768) * 0.1
        perturbation[:10] += np.array([-0.2, -0.2, -0.2] + [0]*7)
        emb = base_vector + perturbation
        cluster4.append(emb / np.linalg.norm(emb))

    return np.vstack([cluster1, cluster2, cluster3, cluster4])


@pytest.fixture
def mock_genai(mocker):
    """Mock Google Generative AI."""
    mock = mocker.patch('google.generativeai')
    return mock
