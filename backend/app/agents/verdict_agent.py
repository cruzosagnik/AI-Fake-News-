"""
Agent F: Verdict Agent
Combines all signals into a final verdict.
Uses Agent A's Gemini output (credibility_score, reasoning, verdict_signal).
No extra Gemini call — saves API quota.
"""
from app.utils.scoring import calculate_authenticity_score, score_to_verdict

VERDICT_MAP = {
    "REAL": "Real",
    "FAKE": "Fake",
    "MISLEADING": "Misleading",
    "PARTIALLY_TRUE": "Partially True",
}

VERDICT_ANCHORS = {
    "Real": 95.0,
    "Partially True": 68.0,
    "Misleading": 38.0,
    "Fake": 12.0,
}

VERDICT_BANDS = {
    "Real": (75.0, 100.0),
    "Partially True": (50.0, 74.0),
    "Misleading": (25.0, 49.0),
    "Fake": (0.0, 24.0),
}


def _normalize_signal(raw_signal: str) -> str | None:
    normalized = str(raw_signal or "").upper().replace(" ", "_")
    return VERDICT_MAP.get(normalized)


def _align_score_to_signal(score: float, signal_verdict: str | None, llm_credibility: float) -> float:
    """
    Keep the displayed authenticity score consistent with the strongest label signal.
    Without this, a FAKE signal plus neutral fallbacks can average back to ~50%.
    """
    if not signal_verdict:
        return score

    low, high = VERDICT_BANDS[signal_verdict]
    # Use the LLM's own exact credibility score instead of a hardcoded anchor
    anchor = max(low, min(high, llm_credibility))
    
    # Give weight to the LLM's explicit dynamic score, while letting the raw calculated score pull it
    adjusted = (score * 0.30) + (anchor * 0.70)
    return max(low, min(high, adjusted))


def generate_verdict(
    extraction: dict,       # Agent A output
    source: dict,           # Agent C output
    bias: dict,             # Agent D output
    semantics: dict,        # Agent E output
) -> dict:
    """
    Compute final weighted verdict from all agent signals.
    No extra Gemini call — uses credibility_score from Agent A's extraction.
    """
    # Extract individual scores
    gemini_score = float(extraction.get("credibility_score", 50))
    source_score = float(source.get("trustScore", 35))
    semantic_score = float(semantics.get("similarityScore", 50))
    bias_score = float(bias.get("biasScore", 30))
    clickbait_score = float(bias.get("clickbaitScore", 20))

    # Weighted formula, then align with the model's explicit verdict signal.
    authenticity = calculate_authenticity_score(
        gemini_reasoning_score=gemini_score,
        source_credibility_score=source_score,
        semantic_similarity_score=semantic_score,
        bias_score=bias_score,
        clickbait_score=clickbait_score,
    )

    # Map LLM's verdict signal + weighted score to final verdict
    raw_signal = extraction.get("verdict_signal", "PARTIALLY_TRUE")
    signal_verdict = _normalize_signal(raw_signal)
    authenticity = _align_score_to_signal(authenticity, signal_verdict, gemini_score)
    score_verdict = score_to_verdict(authenticity)

    # If Gemini signal and score-based verdict agree → high confidence
    if signal_verdict == score_verdict:
        final_verdict = score_verdict
        confidence = 85.0
    else:
        # Blend: trust Gemini signal slightly more for edge cases
        final_verdict = signal_verdict or score_verdict
        confidence = 60.0

    reasoning = extraction.get("reasoning", "Analysis completed using available signals.")
    suspicious_claims = extraction.get("suspicious_patterns", [])
    bias_indicators = extraction.get("bias_indicators", [])

    return {
        "verdict": final_verdict,
        "authenticityScore": round(authenticity, 2),
        "confidenceScore": round(confidence, 1),
        "explanation": reasoning,
        "suspiciousClaims": suspicious_claims,
        "biasIndicators": bias_indicators,
        "agentScores": {
            "geminiReasoning": round(gemini_score, 1),
            "sourceCredibility": round(source_score, 1),
            "semanticSimilarity": round(semantic_score, 1),
            "biasScore": round(bias_score, 1),
            "clickbaitScore": round(clickbait_score, 1),
        },
        "reasoningScore": round(gemini_score, 1),
        "status": "success",
    }
