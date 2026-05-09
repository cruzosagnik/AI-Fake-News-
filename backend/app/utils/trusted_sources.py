from typing import List

TRUSTED_SOURCES = {
    "general":  ["reuters.com", "bbc.com", "apnews.com", "theguardian.com"],
    "health":   ["who.int", "cdc.gov", "nih.gov", "pubmed.ncbi.nlm.nih.gov"],
    "finance":  ["bloomberg.com", "imf.org", "worldbank.org", "rbi.org.in"],
    "tech":     ["nasa.gov", "mit.edu", "techcrunch.com", "wired.com"],
    "sports":   ["espn.com", "icc-cricket.com", "fifa.com", "bcci.tv"],
    "politics": ["reuters.com", "bbc.com", "thehindu.com", "ndtv.com"],
    "india":    ["thehindu.com", "ndtv.com", "pib.gov.in", "indiafactcheck.in"],
}

# Domain-specific system prompts for Gemini
CATEGORY_SYSTEM_PROMPTS = {
    "health": (
        "You are a health misinformation expert. Cross-check claims against WHO/CDC guidelines. "
        "Flag any unverified medical advice, miracle cures, or unsupported statistics."
    ),
    "politics": (
        "You are a political fact-checker. Check claims against AP/Reuters/BBC framing. "
        "Flag partisan language, propaganda techniques, and unsupported allegations."
    ),
    "finance": (
        "You are a financial journalist. Check claims against Bloomberg/IMF/RBI data. "
        "Flag market manipulation signals, unverified economic data, and fear-mongering."
    ),
    "tech": (
        "You are a technology journalist. Check claims against NASA, MIT, and official company sources. "
        "Flag pseudoscience, exaggerated AI claims, and misquoted research."
    ),
    "sports": (
        "You are a sports journalist. Cross-check claims with ESPN/ICC/FIFA official records. "
        "Flag fabricated scores, false endorsements, and fake award claims."
    ),
    "disasters": (
        "You are a disaster reporting expert. Verify claims against government alerts and news agencies. "
        "Flag exaggerated casualty counts and unverified emergency claims."
    ),
}


def get_trusted_domains_for_category(category: str) -> List[str]:
    """Get list of trusted domains relevant to the given category."""
    domains = set(TRUSTED_SOURCES.get("general", []))
    if category in TRUSTED_SOURCES:
        domains.update(TRUSTED_SOURCES[category])
    return list(domains)


def score_domain_trust(domain: str, category: str) -> int:
    """Score trust of a domain (0–100) for a given category."""
    trusted = get_trusted_domains_for_category(category)
    all_trusted = []
    for v in TRUSTED_SOURCES.values():
        all_trusted.extend(v)

    if domain in trusted:
        return 90
    if domain in all_trusted:
        return 75
    # Check for government / educational TLDs
    if domain.endswith(".gov") or domain.endswith(".edu"):
        return 80
    if domain.endswith(".org"):
        return 60
    return 40
