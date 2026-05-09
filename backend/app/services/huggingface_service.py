import os
import httpx
import time

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")

# Updated base URL for HuggingFace Inference API (2025)
HF_BASE = "https://router.huggingface.co/hf-inference/models"

# Verified working models on the router endpoint
SENTIMENT_MODEL = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
SIMILARITY_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
FAKENEWS_MODEL = "jy46604790/Fake-News-Bert-Detect"
FAKENEWS_FALLBACK_MODEL = "hamzab/roberta-fake-news-classification"
HF_NETWORK_COOLDOWN_SECONDS = 60
_HF_OFFLINE_UNTIL = 0.0


class HuggingFaceServiceUnavailableError(ValueError):
    """Raised when HuggingFace cannot be reached due to local/network issues."""


async def _hf_post(model: str, payload: dict, timeout: float = 45.0) -> dict:
    """POST to HuggingFace router inference endpoint."""
    global _HF_OFFLINE_UNTIL

    if time.monotonic() < _HF_OFFLINE_UNTIL:
        remaining = int(_HF_OFFLINE_UNTIL - time.monotonic())
        raise HuggingFaceServiceUnavailableError(f"HuggingFace network is cooling down for {remaining}s")

    headers = {}
    if HF_API_KEY:
        headers["Authorization"] = f"Bearer {HF_API_KEY}"

    url = f"{HF_BASE}/{model}"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
    except httpx.TransportError as e:
        _HF_OFFLINE_UNTIL = time.monotonic() + HF_NETWORK_COOLDOWN_SECONDS
        raise HuggingFaceServiceUnavailableError(
            f"HuggingFace network unavailable; using fallback for {HF_NETWORK_COOLDOWN_SECONDS}s"
        ) from e

    if response.status_code == 429:
        _HF_OFFLINE_UNTIL = time.monotonic() + HF_NETWORK_COOLDOWN_SECONDS
        raise HuggingFaceServiceUnavailableError(
            f"HuggingFace rate limited; using fallback for {HF_NETWORK_COOLDOWN_SECONDS}s"
        )

    response.raise_for_status()
    return response.json()


async def get_sentiment(text: str) -> dict:
    """
    Run cardiffnlp/twitter-roberta-base-sentiment-latest on text.
    Returns: { label: str, score: float }
    Labels: positive | neutral | negative
    """
    if not text or not text.strip():
        return {"label": "neutral", "score": 0.5}
        
    truncated = text[:500]
    try:
        result = await _hf_post(SENTIMENT_MODEL, {"inputs": truncated})
        # Result format: [[{label, score}, ...]]
        if isinstance(result, list) and len(result) > 0:
            labels = result[0] if isinstance(result[0], list) else result
            best = max(labels, key=lambda x: x["score"])
            return {"label": best["label"], "score": best["score"]}
    except HuggingFaceServiceUnavailableError:
        pass
    except Exception as e:
        print(f"[HF] Sentiment error: {e}")
    return {"label": "neutral", "score": 0.5}


async def get_semantic_similarity(text1: str, text2: str) -> float:
    """
    Compute cosine similarity between two texts using all-MiniLM-L6-v2.
    Returns a float 0.0–1.0
    """
    if not text1 or not text1.strip() or not text2 or not text2.strip():
        return 0.5
        
    try:
        result = await _hf_post(
            SIMILARITY_MODEL,
            {"inputs": {"source_sentence": text1[:512], "sentences": [text2[:512]]}},
            timeout=60.0,  # Cold start can be slow
        )
        if isinstance(result, list) and len(result) > 0:
            return float(result[0])
    except HuggingFaceServiceUnavailableError:
        pass
    except Exception as e:
        print(f"[HF] Similarity error: {e}")
    return 0.5


async def get_fakenews_signal(text: str) -> dict:
    """
    Run fake news classification models.
    Returns: { label: str, score: float, model: str }
    """
    if not text or not text.strip():
        return {"label": "REAL", "score": 0.5, "model": None}
        
    truncated = text[:512]
    for model in (FAKENEWS_MODEL, FAKENEWS_FALLBACK_MODEL):
        try:
            result = await _hf_post(model, {"inputs": truncated})
        except HuggingFaceServiceUnavailableError:
            break
        except Exception as e:
            print(f"[HF] FakeNews error ({model}): {e}")
            continue

        if isinstance(result, list) and len(result) > 0:
            labels = result[0] if isinstance(result[0], list) else result
            best = max(labels, key=lambda x: x["score"])
            return {"label": best["label"], "score": best["score"], "model": model}

    return {"label": "REAL", "score": 0.5, "model": None}
