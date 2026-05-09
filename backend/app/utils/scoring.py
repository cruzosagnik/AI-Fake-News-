def calculate_authenticity_score(
    gemini_reasoning_score: float,
    source_credibility_score: float,
    semantic_similarity_score: float,
    bias_score: float,
    clickbait_score: float,
) -> float:
    """
    Weighted authenticity score formula as per spec.
    All inputs are 0–100.
    """
    score = (
        gemini_reasoning_score * 0.35
        + source_credibility_score * 0.25
        + semantic_similarity_score * 0.20
        + (100 - bias_score) * 0.10
        + (100 - clickbait_score) * 0.10
    )
    return round(max(0.0, min(100.0, score)), 2)


# Alias for compatibility
compute_authenticity_score = calculate_authenticity_score


def score_to_verdict(score: float) -> str:
    """Map authenticity score to verdict label."""
    if score >= 75:
        return "Real"
    elif score >= 50:
        return "Partially True"
    elif score >= 25:
        return "Misleading"
    else:
        return "Fake"


def calculate_confidence(agent_scores: list[float]) -> float:
    """
    Confidence = agreement among agent signals (low variance = high confidence).
    """
    if not agent_scores:
        return 50.0
    mean = sum(agent_scores) / len(agent_scores)
    variance = sum((s - mean) ** 2 for s in agent_scores) / len(agent_scores)
    # Higher variance → lower confidence; normalize to 0–100
    confidence = max(0.0, 100.0 - (variance ** 0.5))
    return round(min(100.0, confidence), 2)
