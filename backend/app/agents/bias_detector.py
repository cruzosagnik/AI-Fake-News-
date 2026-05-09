"""
Agent D: Bias Detector
Uses HuggingFace sentiment analysis — no Gemini call.
Also uses bias_indicators from Agent A's extraction.
"""
from app.services.huggingface_service import get_sentiment

# Clickbait patterns
CLICKBAIT_PHRASES = [
    "you won't believe", "shocking", "mind-blowing", "breaking",
    "exposed", "revealed", "secret", "they don't want you to know",
    "miracle", "cure", "proven", "doctors hate", "one weird trick",
    "urgent", "warning", "alert", "must read", "jaw-dropping",
]


def _clickbait_score(text: str) -> int:
    """Score 0-100 based on clickbait phrase density."""
    text_lower = text.lower()
    matches = sum(1 for phrase in CLICKBAIT_PHRASES if phrase in text_lower)
    return min(matches * 20, 100)


async def detect_bias(text: str, bias_indicators: list[str] | None = None) -> dict:
    """
    Returns bias_score and clickbait_score using HF sentiment + heuristics.
    """
    clickbait = _clickbait_score(text)

    # Bias from HuggingFace sentiment
    try:
        sentiment = await get_sentiment(text)
        label = sentiment.get("label", "neutral").lower()
        score = sentiment.get("score", 0.5)

        # Extreme positive/negative with high confidence → biased
        if label in ("positive", "negative") and score > 0.85:
            bias_from_sentiment = int(score * 70)
        elif label in ("positive", "negative"):
            bias_from_sentiment = int(score * 40)
        else:
            bias_from_sentiment = 10
    except Exception as e:
        print(f"[Agent D] Sentiment error: {e}")
        sentiment = {"label": "neutral", "score": 0.5}
        bias_from_sentiment = 30

    # Extra bias from Gemini-detected bias indicators
    indicator_boost = min(len(bias_indicators or []) * 10, 30)
    bias_score = min(bias_from_sentiment + indicator_boost, 100)

    return {
        "biasScore": bias_score,
        "clickbaitScore": clickbait,
        "sentiment": sentiment.get("label", "neutral"),
        "sentimentConfidence": round(sentiment.get("score", 0.5), 3),
        "biasIndicators": bias_indicators or [],
        "status": "success",
    }
