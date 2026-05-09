"""
Agent A: Claim Extractor
Makes ONE consolidated Gemini call that returns claims, category,
credibility signals, and reasoning - shared across all downstream agents.
"""
from app.services.llm_service import call_llm_json
from app.services.llm_service import LLMRateLimitError
from app.services.llm_service import LLMServiceUnavailableError
from app.services.huggingface_service import get_fakenews_signal

EXTRACTION_PROMPT = """Analyze this content and return a JSON object with exactly these fields:

{
  "claims": ["list of 3-5 main verifiable claims made in the text"],
  "category": "one of: politics|health|technology|sports|entertainment|finance|science|environment|religion|other",
  "credibility_score": <integer 0-100 representing how credible the content appears>,
  "reasoning": "<2-3 sentence explanation of your credibility assessment>",
  "bias_indicators": ["list of any biased phrases or emotionally charged language found"],
  "suspicious_patterns": ["list of any misleading patterns: exaggeration, missing context, false causation, etc."],
  "verdict_signal": "one of: REAL|FAKE|MISLEADING|PARTIALLY_TRUE"
}

Content to analyze:
"""


async def extract_claims(text: str, language: str = "en") -> dict:
    """
    Run comprehensive Gemini analysis - ONE call for all downstream agents.
    Returns a shared analysis dict used by all other agents.
    """
    if not text or len(text.strip()) < 10:
        return await _fallback_extraction(text, "too_short")

    try:
        result = await call_llm_json(EXTRACTION_PROMPT + text[:3000])
        return {
            "claims": result.get("claims", [])[:5],
            "category": _normalize_category(result.get("category", "other")),
            "credibility_score": int(result.get("credibility_score", 50)),
            "reasoning": result.get("reasoning", "Analysis completed."),
            "bias_indicators": result.get("bias_indicators", [])[:5],
            "suspicious_patterns": result.get("suspicious_patterns", [])[:5],
            "verdict_signal": result.get("verdict_signal", "PARTIALLY_TRUE"),
            "status": "success",
        }
    except LLMRateLimitError as e:
        print(f"[Agent A] Groq rate limited; using fallback analysis. {e}")
        return await _fallback_extraction(text, "rate_limited")
    except LLMServiceUnavailableError as e:
        print(f"[Agent A] Groq unavailable; using offline fallback analysis. {e}")
        return await _fallback_extraction(text, "offline")
    except Exception as e:
        print(f"[Agent A] Groq extraction failed: {e}")
        return await _fallback_extraction(text, "unavailable")


def _normalize_category(cat: str) -> str:
    valid = {
        "politics",
        "health",
        "technology",
        "sports",
        "entertainment",
        "finance",
        "science",
        "environment",
        "religion",
        "other",
    }
    cat = str(cat).lower().strip()
    return cat if cat in valid else "other"


async def _fallback_extraction(text: str = "", reason: str = "unavailable") -> dict:
    text_lower = text.lower()
    fake_patterns = [
        "cures cancer",
        "miracle cure",
        "doctors hate",
        "one weird trick",
        "they don't want you to know",
        "secret government",
        "confirmed by nasa",
        "who endorses",
        "100% guaranteed",
    ]
    misleading_patterns = [
        "shocking",
        "breaking",
        "exposed",
        "revealed",
        "urgent",
        "warning",
        "must read",
        "crash",
        "overnight",
    ]

    fake_hits = [pattern for pattern in fake_patterns if pattern in text_lower]
    misleading_hits = [pattern for pattern in misleading_patterns if pattern in text_lower]

    hf_signal = await _safe_fakenews_signal(text)

    if hf_signal["verdict_signal"]:
        verdict_signal = hf_signal["verdict_signal"]
        credibility_score = hf_signal["credibility_score"]
        suspicious_patterns = (fake_hits + misleading_hits)[:5]
        reasoning = (
            "Groq is temporarily unavailable, so TruthLens used its fallback classifier "
            "and local misinformation heuristics for this analysis."
        )
    elif fake_hits:
        credibility_score = 15
        verdict_signal = "FAKE"
        suspicious_patterns = fake_hits[:5]
        reasoning = (
            "AI services were unavailable, so TruthLens used safety heuristics. "
            "The text contains high-risk misinformation patterns that commonly appear in fabricated claims."
        )
    elif len(misleading_hits) >= 2:
        credibility_score = 35
        verdict_signal = "MISLEADING"
        suspicious_patterns = misleading_hits[:5]
        reasoning = (
            "AI services were unavailable, so TruthLens used safety heuristics. "
            "The text uses sensational or context-poor wording that may be misleading."
        )
    else:
        credibility_score = 45
        verdict_signal = "PARTIALLY_TRUE"
        suspicious_patterns = []
        reasoning = (
            "AI services were unavailable, so TruthLens used conservative fallback heuristics. "
            "Manual review is recommended."
        )

    return {
        "claims": [],
        "category": "other",
        "credibility_score": credibility_score,
        "reasoning": reasoning,
        "bias_indicators": [],
        "suspicious_patterns": suspicious_patterns,
        "verdict_signal": verdict_signal,
        "status": f"fallback_{reason}",
    }


async def _safe_fakenews_signal(text: str) -> dict:
    signal = {"verdict_signal": None, "credibility_score": None}
    try:
        result = await get_fakenews_signal(text)
    except Exception as e:
        print(f"[Agent A] Fallback fake-news classifier failed: {e}")
        return signal

    label = str(result.get("label", "")).lower()
    confidence = float(result.get("score", 0.0))
    if confidence < 0.65:
        return signal

    if "fake" in label or "false" in label or label in {"label_0", "0"}:
        return {"verdict_signal": "FAKE", "credibility_score": int((1.0 - confidence) * 30)}
    if "real" in label or "true" in label or label in {"label_1", "1"}:
        return {"verdict_signal": "REAL", "credibility_score": int(70 + confidence * 25)}
    return signal
