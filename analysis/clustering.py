"""Clustering logic with K-means and silhouette scoring."""

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import cosine_similarity
from typing import Tuple, Optional, List, Dict

from .config import config


def find_optimal_clusters(
    embeddings: np.ndarray,
    min_k: Optional[int] = None,
    max_k: Optional[int] = None
) -> Tuple[int, float]:
    """
    Find optimal number of clusters using silhouette score.

    Args:
        embeddings: Numpy array of embeddings
        min_k: Minimum number of clusters (default from config)
        max_k: Maximum number of clusters (default from config)

    Returns:
        Tuple of (best_k, best_score)
    """
    if min_k is None:
        min_k = config.MIN_CLUSTERS
    if max_k is None:
        max_k = config.MAX_CLUSTERS

    n_samples = len(embeddings)

    # Adjust max_k if we have fewer samples
    max_k = min(max_k, n_samples // 2)
    min_k = min(min_k, max_k)

    if min_k >= max_k:
        return min_k, 0.0

    best_k, best_score = min_k, -1.0

    for k in range(min_k, max_k + 1):
        try:
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(embeddings)

            # Calculate silhouette score
            score = silhouette_score(embeddings, labels)

            if score > best_score:
                best_k = k
                best_score = score

        except Exception as e:
            print(f"Error clustering with k={k}: {e}")
            continue

    return best_k, best_score


def cluster_responses(
    embeddings: np.ndarray,
    k: Optional[int] = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Cluster responses using K-means.

    Args:
        embeddings: Numpy array of embeddings
        k: Number of clusters (if None, finds optimal)

    Returns:
        Tuple of (labels, centroids)
    """
    if k is None:
        k, _ = find_optimal_clusters(embeddings)

    # Ensure k is valid
    k = max(1, min(k, len(embeddings)))

    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(embeddings)
    centroids = kmeans.cluster_centers_

    return labels, centroids


def calculate_cluster_confidence(
    embeddings: np.ndarray,
    labels: np.ndarray,
    centroids: np.ndarray
) -> np.ndarray:
    """
    Calculate confidence score for each cluster.

    Confidence is based on how tightly grouped the cluster is.

    Args:
        embeddings: Numpy array of embeddings
        labels: Cluster labels
        centroids: Cluster centroids

    Returns:
        Array of confidence scores (0-1) for each cluster
    """
    unique_labels = np.unique(labels)
    confidences = np.zeros(len(unique_labels))

    for i, label in enumerate(unique_labels):
        cluster_embeddings = embeddings[labels == label]

        if len(cluster_embeddings) == 0:
            confidences[i] = 0.5
            continue

        # Calculate average distance to centroid
        distances = np.linalg.norm(
            cluster_embeddings - centroids[label],
            axis=1
        )
        avg_distance = np.mean(distances)
        std_distance = np.std(distances)

        # Convert to confidence (lower distance = higher confidence)
        # Normalize to 0-1 range
        confidence = 1.0 / (1.0 + avg_distance)
        confidences[i] = max(0.5, min(0.95, confidence))

    return confidences


def assign_multi_themes(
    embeddings: np.ndarray,
    centroids: np.ndarray,
    relative_factor: Optional[float] = None,
    max_themes_per_response: Optional[int] = None
) -> List[List[int]]:
    """
    Assign each response to multiple themes based on relative cosine similarity.

    A response can belong to multiple themes if its similarity to a centroid
    is within relative_factor of the best-matching centroid (e.g., 95% of max).
    This adapts to the actual similarity distribution rather than using a fixed
    absolute threshold.

    Args:
        embeddings: Numpy array of response embeddings
        centroids: Cluster centroids
        relative_factor: Similarity must be >= (max_sim * relative_factor) (default from config)
        max_themes_per_response: Hard cap on themes per response (default from config)

    Returns:
        List where each element is a list of theme indices that response belongs to
    """
    if relative_factor is None:
        relative_factor = config.MULTI_THEME_RELATIVE_FACTOR
    if max_themes_per_response is None:
        max_themes_per_response = config.MAX_THEMES_PER_RESPONSE

    # Calculate cosine similarity between each embedding and all centroids
    similarities = cosine_similarity(embeddings, centroids)

    # Assign each response to themes using relative threshold
    multi_assignments = []
    for i, sims in enumerate(similarities):
        # Find max similarity
        max_sim = np.max(sims)

        # Calculate relative threshold based on max
        relative_threshold = max_sim * relative_factor

        # Get theme indices where similarity exceeds relative threshold
        assigned_themes = [j for j, sim in enumerate(sims) if sim >= relative_threshold]

        # If no themes meet threshold (shouldn't happen but be safe), assign to most similar
        if not assigned_themes:
            assigned_themes = [int(np.argmax(sims))]

        # Cap the number of themes per response
        if len(assigned_themes) > max_themes_per_response:
            # Keep only the top max_themes_per_response by similarity
            theme_sims = [(j, sims[j]) for j in assigned_themes]
            theme_sims.sort(key=lambda x: x[1], reverse=True)
            assigned_themes = [j for j, _ in theme_sims[:max_themes_per_response]]

        multi_assignments.append(assigned_themes)

    return multi_assignments


def get_theme_to_responses_mapping(
    multi_assignments: List[List[int]],
    num_themes: int
) -> Dict[int, List[int]]:
    """
    Convert multi-assignments to theme -> response indices mapping.

    Args:
        multi_assignments: List where each element is list of theme indices
        num_themes: Total number of themes

    Returns:
        Dict mapping theme_id to list of response indices
    """
    theme_mapping = {i: [] for i in range(num_themes)}

    for response_idx, theme_ids in enumerate(multi_assignments):
        for theme_id in theme_ids:
            theme_mapping[theme_id].append(response_idx)

    return theme_mapping
