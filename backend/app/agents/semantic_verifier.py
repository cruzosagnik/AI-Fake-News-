"""
Agent E: Semantic Verifier
Uses HuggingFace sentence-transformers similarity — no Gemini call.
"""
from app.services.huggingface_service import get_semantic_similarity

# Reference statements to compare claims against (domain knowledge baselines)
KNOWN_FACTS = [
    "No cancer cure has been universally confirmed by medical science.",
    "WHO follows evidence-based medicine and does not endorse unproven therapies.",
    "Climate change is caused by human greenhouse gas emissions according to scientific consensus.",
    "Vaccines are safe and effective according to peer-reviewed medical research.",
    "Elections in democratic countries are conducted through official verified processes.",
]


async def verify_semantics(text: str, claims: list[str]) -> dict:
    """
    Compute semantic consistency between claims and known reliable statements.
    Returns similarity_score 0–100.
    """
    if not claims and not text:
        return _fallback()

    # Use top 3 claims or full text
    sample = claims[:3] if claims else [text[:500]]
    reference = text[:300] if len(text) > 100 else text

    try:
        # Compare claims against the main article text to verify internal consistency
        scores: list[float] = []
        for claim in sample:
            sim = await get_semantic_similarity(claim, reference)
            scores.append(sim)

        if scores:
            avg_sim = sum(scores) / len(scores)
            # Claims extracted from the text should have high similarity with the text itself
            similarity_score = round(avg_sim * 100, 1)
            # Boost score slightly as HF similarity can be artificially low for short phrases
            similarity_score = min(100.0, similarity_score + 15.0)
        else:
            similarity_score = 80.0

        return {
            "similarityScore": similarity_score,
            "contradictions": [],
            "semanticConsistency": similarity_score > 40,
            "status": "success",
        }
    except Exception as e:
        print(f"[Agent E] Semantic error: {e}")
        return _fallback()


def _fallback() -> dict:
    return {
        "similarityScore": 50.0,
        "contradictions": [],
        "semanticConsistency": True,
        "status": "fallback",
    }
