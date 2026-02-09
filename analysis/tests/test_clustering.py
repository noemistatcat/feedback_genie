"""Tests for clustering module."""

import pytest
import numpy as np
from analysis.clustering import (
    find_optimal_clusters,
    cluster_responses,
    calculate_cluster_confidence,
    assign_multi_themes,
    get_theme_to_responses_mapping
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


def test_assign_multi_themes_selective(high_similarity_embeddings):
    """
    Test that assign_multi_themes is selective and doesn't assign all themes to all responses.

    Uses high-similarity embeddings that mimic real Gemini space where baseline
    cosine similarities are naturally high (0.7-0.9).
    """
    # Cluster the embeddings
    labels, centroids = cluster_responses(high_similarity_embeddings, k=4)

    # Use default relative threshold (0.95)
    multi_assignments = assign_multi_themes(high_similarity_embeddings, centroids)

    # Verify structure
    assert len(multi_assignments) == len(high_similarity_embeddings)
    assert all(isinstance(assignment, list) for assignment in multi_assignments)

    # Critical: No response should be assigned to ALL themes (the bug we're fixing)
    num_themes = len(centroids)
    for assignment in multi_assignments:
        assert len(assignment) < num_themes, \
            f"Response assigned to {len(assignment)} themes out of {num_themes}, should be selective"

    # Most responses should be assigned to 1-2 themes, not all
    avg_themes_per_response = sum(len(a) for a in multi_assignments) / len(multi_assignments)
    assert avg_themes_per_response < 2.5, \
        f"Average {avg_themes_per_response} themes per response is too high, should be ~1-2"


def test_assign_multi_themes_primary_always_assigned(high_similarity_embeddings):
    """Test that each response is always assigned to at least its primary (best-match) theme."""
    labels, centroids = cluster_responses(high_similarity_embeddings, k=4)

    multi_assignments = assign_multi_themes(high_similarity_embeddings, centroids)

    # Every response must have at least one theme
    for assignment in multi_assignments:
        assert len(assignment) >= 1, "Every response must be assigned to at least one theme"


def test_assign_multi_themes_respects_cap(high_similarity_embeddings):
    """Test that MAX_THEMES_PER_RESPONSE cap is enforced."""
    labels, centroids = cluster_responses(high_similarity_embeddings, k=4)

    # Set a very low relative factor to trigger many assignments, then verify cap works
    max_themes = 2
    multi_assignments = assign_multi_themes(
        high_similarity_embeddings,
        centroids,
        relative_factor=0.80,  # Permissive threshold to trigger many assignments
        max_themes_per_response=max_themes
    )

    # Verify cap is enforced
    for assignment in multi_assignments:
        assert len(assignment) <= max_themes, \
            f"Response assigned to {len(assignment)} themes, exceeds cap of {max_themes}"


def test_assign_multi_themes_allows_genuine_overlap():
    """
    Test that responses genuinely close to multiple centroids get assigned to multiple themes.

    Creates a controlled scenario where an embedding is very close to two centroids.
    """
    # Create 3 well-separated centroids manually
    np.random.seed(42)
    centroid_0 = np.zeros(768)
    centroid_0[0] = 1.0
    centroid_0 = centroid_0 / np.linalg.norm(centroid_0)

    centroid_1 = np.zeros(768)
    centroid_1[1] = 1.0
    centroid_1 = centroid_1 / np.linalg.norm(centroid_1)

    centroid_2 = np.zeros(768)
    centroid_2[2] = 1.0
    centroid_2 = centroid_2 / np.linalg.norm(centroid_2)

    centroids = np.vstack([centroid_0, centroid_1, centroid_2])

    # Create an embedding that's very similar to both centroid_0 and centroid_1
    # by mixing them with small weights
    ambiguous_embedding = 0.5 * centroid_0 + 0.5 * centroid_1
    ambiguous_embedding = ambiguous_embedding / np.linalg.norm(ambiguous_embedding)

    test_embeddings = np.vstack([ambiguous_embedding])

    # Use a permissive relative factor to allow multi-assignment
    multi_assignments = assign_multi_themes(test_embeddings, centroids, relative_factor=0.90)

    # The ambiguous embedding should be assigned to multiple themes
    assignment = multi_assignments[0]

    # With relative factor 0.90, an ambiguous point should get both nearby themes
    assert len(assignment) >= 2, \
        f"Ambiguous embedding assigned to only {len(assignment)} theme(s), should be assigned to multiple"


def test_get_theme_to_responses_mapping():
    """Test conversion from per-response assignments to per-theme mapping."""
    # Create sample multi-assignments
    # Response 0: themes [0, 1]
    # Response 1: theme [1]
    # Response 2: themes [2]
    # Response 3: themes [0, 2]
    multi_assignments = [[0, 1], [1], [2], [0, 2]]
    num_themes = 3

    theme_mapping = get_theme_to_responses_mapping(multi_assignments, num_themes)

    # Verify structure
    assert len(theme_mapping) == num_themes
    assert all(isinstance(responses, list) for responses in theme_mapping.values())

    # Verify mappings
    assert set(theme_mapping[0]) == {0, 3}  # Theme 0 has responses 0 and 3
    assert set(theme_mapping[1]) == {0, 1}  # Theme 1 has responses 0 and 1
    assert set(theme_mapping[2]) == {2, 3}  # Theme 2 has responses 2 and 3


def test_no_all_themes_regression(high_similarity_embeddings):
    """
    Regression test: Verify the bug where all themes were assigned to all rows is fixed.

    This is an integration-style test that runs the full clustering pipeline
    and asserts that no response is assigned to ALL themes.
    """
    # Run full clustering
    labels, centroids = cluster_responses(high_similarity_embeddings, k=4)

    # Get multi-theme assignments
    multi_assignments = assign_multi_themes(high_similarity_embeddings, centroids)

    # Convert to theme mapping
    theme_mapping = get_theme_to_responses_mapping(multi_assignments, len(centroids))

    num_responses = len(high_similarity_embeddings)
    num_themes = len(centroids)

    # CRITICAL ASSERTION: No theme should contain ALL responses
    for theme_id, response_indices in theme_mapping.items():
        assert len(response_indices) < num_responses, \
            f"Theme {theme_id} contains ALL {num_responses} responses - regression detected!"

    # Also verify from the other direction: no response should be in ALL themes
    for response_idx, theme_ids in enumerate(multi_assignments):
        assert len(theme_ids) < num_themes, \
            f"Response {response_idx} assigned to ALL {num_themes} themes - regression detected!"

    # Sanity check: themes should have reasonable coverage (not empty, not everything)
    for theme_id, response_indices in theme_mapping.items():
        assert len(response_indices) > 0, f"Theme {theme_id} is empty"
        coverage_pct = (len(response_indices) / num_responses) * 100
        assert coverage_pct < 90, \
            f"Theme {theme_id} covers {coverage_pct:.1f}% of responses, too high"
