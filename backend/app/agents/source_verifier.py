"""
Agent C: Source Verifier
Registry-based trust scoring — no Gemini call needed.
Uses domain extraction + trusted source scoring.
"""
import re
from typing import List
from app.utils.trusted_sources import get_trusted_domains_for_category, score_domain_trust


def _extract_domains(text: str) -> List[str]:
    pattern = r'\b(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)\b'
    matches = re.findall(pattern, text)
    return list(set(m.lower() for m in matches))


async def verify_sources(content: str, category: str, claims: List[str]) -> dict:
    """Score content trustworthiness based on domain registry."""
    trusted_defaults = get_trusted_domains_for_category(category)

    # Extract all mentioned domains
    text_blob = content + " ".join(claims)
    domains = _extract_domains(text_blob)

    if domains:
        scores = [score_domain_trust(d, category) for d in domains]
        trust_score = int(sum(scores) / len(scores))
        display_sources = domains[:6]
    else:
        # No sources cited → low trust baseline
        trust_score = 30
        display_sources = trusted_defaults[:3]

    # Boost score if well-known trusted domains are present
    high_trust_found = any(score_domain_trust(d, category) >= 80 for d in domains)
    if high_trust_found:
        trust_score = min(trust_score + 15, 100)

    return {
        "sources": display_sources,
        "trustScore": trust_score,
        "status": "success",
        "verificationNotes": f"Checked {len(domains)} domain(s) against registry.",
    }
