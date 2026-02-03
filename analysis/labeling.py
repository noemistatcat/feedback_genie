"""LLM theme labeling with parallel processing."""

import asyncio
import json
import numpy as np
from typing import List, Dict, Optional
import google.generativeai as genai

from .config import config
from .models import Theme


def is_generic_theme_name(name: str) -> bool:
    """Check if theme name is too generic."""
    generic_patterns = [
        "theme",
        "cluster",
        "group",
        "category",
    ]
    name_lower = name.lower()

    # Check if it's just "Theme 1", "Theme 2", etc.
    for pattern in generic_patterns:
        if pattern in name_lower and any(char.isdigit() for char in name):
            return True

    return False


async def label_cluster(cluster_id: int, samples: List[str], max_retries: Optional[int] = None) -> Dict:
    """
    Label a single cluster using LLM.

    Args:
        cluster_id: Cluster identifier
        samples: Sample responses from this cluster
        max_retries: Number of times to retry if generic name is returned

    Returns:
        Dict with name, description, and cluster_id
    """
    if max_retries is None:
        max_retries = config.MAX_LABELING_RETRIES

    prompt = f"""Analyze these {len(samples)} customer responses that share a common theme.

Responses:
{chr(10).join(f'- {s[:200]}{"..." if len(s) > 200 else ""}' for s in samples)}

Your task: Identify the SPECIFIC theme that unifies these responses.

IMPORTANT:
- Create a DESCRIPTIVE theme name (2-5 words)
- DO NOT use generic names like "Theme 1", "Category A", or "Group 1"
- The name should capture the essence of what customers are saying
- Think about the specific topic, emotion, or issue being discussed

Return ONLY valid JSON in this exact format:
{{"name": "Your Descriptive Theme Name", "description": "A clear one-sentence explanation of this theme"}}"""

    for attempt in range(max_retries + 1):
        try:
            model = genai.GenerativeModel(config.LLM_MODEL)
            response = await asyncio.to_thread(
                model.generate_content,
                prompt
            )

            # Try to extract JSON from response
            text = response.text.strip()

            # Remove markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            result = json.loads(text)

            # Validate we have required fields
            if "name" not in result or "description" not in result:
                raise ValueError(f"Missing required fields in response: {result}")

            # Check if name is too generic
            if is_generic_theme_name(result['name']):
                if attempt < max_retries:
                    print(f"Generic theme name detected for cluster {cluster_id}: '{result['name']}'. Retrying...")
                    # Add example to prompt for next attempt
                    prompt += f"\n\nNote: Avoid generic names. Be more specific than '{result['name']}'"
                    continue
                else:
                    print(f"Warning: Still generic after retries for cluster {cluster_id}: '{result['name']}'")

            result['cluster_id'] = cluster_id
            return result

        except json.JSONDecodeError as e:
            print(f"JSON parse error for cluster {cluster_id} (attempt {attempt + 1}): {e}")
            print(f"Response text: {text[:200]}...")
            if attempt == max_retries:
                # Final fallback
                return {
                    "cluster_id": cluster_id,
                    "name": f"Theme {cluster_id + 1}",
                    "description": "Collection of related responses"
                }
        except Exception as e:
            print(f"Error labeling cluster {cluster_id} (attempt {attempt + 1}): {e}")
            if attempt == max_retries:
                # Final fallback
                return {
                    "cluster_id": cluster_id,
                    "name": f"Theme {cluster_id + 1}",
                    "description": "Collection of related responses"
                }

    # Should not reach here, but just in case
    return {
        "cluster_id": cluster_id,
        "name": f"Theme {cluster_id + 1}",
        "description": "Collection of related responses"
    }


async def label_all_clusters(
    labels: np.ndarray,
    responses: List[str],
    embeddings: np.ndarray,
    centroids: np.ndarray,
    confidences: np.ndarray,
    theme_to_responses: Dict[int, List[int]] = None
) -> List[Theme]:
    """
    Label all clusters in parallel.

    Args:
        labels: Cluster labels for each response (used if theme_to_responses is None)
        responses: Original response texts
        embeddings: Response embeddings
        centroids: Cluster centroids
        confidences: Confidence scores for each cluster
        theme_to_responses: Optional mapping of theme_id -> response_indices for multi-theme assignment

    Returns:
        List of Theme objects
    """
    # Use multi-theme mapping if provided, otherwise fall back to single assignment
    if theme_to_responses is not None:
        cluster_all_indices = theme_to_responses
        unique_labels = list(theme_to_responses.keys())
    else:
        unique_labels = np.unique(labels)
        cluster_all_indices = {}
        for cluster_id in unique_labels:
            indices = np.where(labels == cluster_id)[0]
            cluster_all_indices[cluster_id] = indices.tolist()

    # Prepare samples for each cluster (up to 20 responses)
    cluster_samples = {}

    for cluster_id in unique_labels:
        indices = cluster_all_indices[cluster_id]

        # Sample up to 20, prioritize those closest to centroid
        if len(indices) > 20:
            indices_array = np.array(indices)
            distances = np.linalg.norm(
                embeddings[indices_array] - centroids[cluster_id],
                axis=1
            )
            closest = indices_array[np.argsort(distances)[:20]]
            cluster_samples[cluster_id] = [responses[i] for i in closest]
        else:
            cluster_samples[cluster_id] = [responses[i] for i in indices]

    # Label ALL clusters in parallel
    tasks = [
        label_cluster(int(cid), samples)
        for cid, samples in cluster_samples.items()
    ]
    results = await asyncio.gather(*tasks)

    # Build Theme objects
    themes = []
    total_responses = len(responses)

    for result in results:
        cluster_id = result['cluster_id']
        indices = cluster_all_indices[cluster_id]

        # Get representative quotes (first 5)
        representative_quotes = [
            responses[i] for i in indices[:5]
        ]

        themes.append(Theme(
            id=f"theme_{cluster_id}",
            name=result['name'],
            description=result['description'],
            response_indices=indices,
            representative_quotes=representative_quotes,
            confidence=float(confidences[cluster_id]),
            count=len(indices),
            percentage=(len(indices) / total_responses) * 100
        ))

    return themes
