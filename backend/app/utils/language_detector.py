def detect_language(text: str) -> str:
    """
    Detect language of the given text.
    Returns 'en', 'hi', or 'bn'. Falls back to 'en'.
    """
    try:
        from langdetect import detect
        lang = detect(text)
        if lang in ("en", "hi", "bn"):
            return lang
        # Map common langdetect codes
        mapping = {
            "en-us": "en",
            "en-gb": "en",
        }
        return mapping.get(lang, "en")
    except Exception:
        return "en"
