"""
Agent B: Category Detector
Uses the category from Agent A's extraction + keyword fallback.
No extra Gemini call needed.
"""
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "politics": ["government", "election", "president", "minister", "parliament", "vote", "politician", "senate", "congress", "policy", "party", "democrat", "republican"],
    "health": ["covid", "vaccine", "cancer", "hospital", "doctor", "disease", "cure", "medicine", "virus", "health", "patient", "treatment", "fda", "who", "pandemic"],
    "technology": ["ai", "software", "tech", "computer", "robot", "crypto", "bitcoin", "app", "internet", "hack", "data", "algorithm", "startup", "silicon"],
    "sports": ["cricket", "football", "match", "player", "team", "score", "champion", "fifa", "ipl", "olympic", "tournament", "athlete", "stadium"],
    "entertainment": ["movie", "film", "actor", "actress", "bollywood", "hollywood", "celebrity", "singer", "music", "award", "oscar", "grammy"],
    "finance": ["stock", "market", "economy", "bank", "investment", "dollar", "rupee", "gdp", "inflation", "trade", "budget", "recession", "profit"],
    "science": ["research", "study", "scientists", "discovery", "nasa", "space", "climate", "experiment", "lab", "journal", "published"],
    "environment": ["climate", "carbon", "emissions", "forest", "pollution", "ocean", "biodiversity", "renewable", "solar", "earth", "green"],
    "religion": ["temple", "mosque", "church", "prayer", "god", "faith", "religious", "hindu", "muslim", "christian", "spiritual"],
}


def detect_category(text: str, gemini_category: str = "other") -> str:
    """
    Return category — prefer Gemini result, fall back to keyword heuristic.
    """
    if gemini_category and gemini_category != "other":
        return gemini_category

    text_lower = text.lower()
    scores: dict[str, int] = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        scores[cat] = sum(1 for kw in keywords if kw in text_lower)

    if max(scores.values(), default=0) > 0:
        return max(scores, key=lambda k: scores[k])
    return "other"
