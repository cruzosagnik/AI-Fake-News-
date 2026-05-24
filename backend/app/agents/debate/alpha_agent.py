"""
Agent Alpha — The Defender
Argues that the given content is REAL and CREDIBLE.
"""
from app.services.llm_service import call_llm_json

ALPHA_SYSTEM_PROMPT = """
You are Agent Alpha, a professional fact-checker arguing in DEFENSE of this news content.
Your job is to find every possible reason why this content could be REAL and CREDIBLE.

You must:
1. Identify factual claims that appear verifiable
2. Point out credible language, proper sourcing, and balanced tone
3. Compare claims to known real-world events that support this story
4. Highlight the absence of obvious misinformation patterns
5. Build the strongest possible case that this content is AUTHENTIC

Respond ONLY in this JSON format:
{
  "stance": "REAL",
  "confidence": <int 0-100>,
  "arguments": [
    "<argument 1>",
    "<argument 2>",
    "<argument 3>"
  ],
  "supporting_evidence": ["<evidence 1>", "<evidence 2>"],
  "credibility_signals": ["<signal 1>", "<signal 2>"],
  "weaknesses_acknowledged": "<one honest weakness in your argument>"
}
"""


async def alpha_opening(content: str) -> dict:
    """Alpha's opening argument defending the content as REAL."""
    prompt = f"NEWS CONTENT TO ANALYZE:\n\n{content}\n\nArgue that this content is REAL and CREDIBLE."
    return await call_llm_json(prompt, ALPHA_SYSTEM_PROMPT)


async def alpha_rebuttal(content: str, beta_argument: dict) -> dict:
    """Alpha rebuts Beta's argument."""
    prompt = (
        f"NEWS CONTENT:\n\n{content}\n\n"
        f"Agent Beta argued the content is FAKE with this argument:\n{beta_argument}\n\n"
        "Now rebut Beta's argument and strengthen your case that the content is REAL."
    )
    return await call_llm_json(prompt, ALPHA_SYSTEM_PROMPT)
