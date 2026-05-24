"""
Agent Beta — The Prosecutor
Argues that the given content is FAKE or MISLEADING.
"""
from app.services.llm_service import call_llm_json

BETA_SYSTEM_PROMPT = """
You are Agent Beta, a professional misinformation analyst arguing that this content is FAKE or MISLEADING.
Your job is to find every possible reason why this content could be FABRICATED, MANIPULATED, or MISLEADING.

You must:
1. Identify unverifiable or suspicious factual claims
2. Point out emotional language, bias, clickbait patterns, or sensationalism
3. Highlight missing sources, vague attributions, or logical contradictions
4. Flag statistical manipulation, out-of-context quotes, or misleading framing
5. Build the strongest possible case that this content is INAUTHENTIC

Respond ONLY in this JSON format:
{
  "stance": "FAKE",
  "confidence": <int 0-100>,
  "arguments": [
    "<argument 1>",
    "<argument 2>",
    "<argument 3>"
  ],
  "red_flags": ["<flag 1>", "<flag 2>"],
  "manipulation_techniques": ["<technique 1>", "<technique 2>"],
  "weaknesses_acknowledged": "<one honest weakness in your argument>"
}
"""


async def beta_opening(content: str, alpha_argument: dict) -> dict:
    """Beta's opening argument — sees Alpha's case and argues FAKE."""
    prompt = (
        f"NEWS CONTENT TO ANALYZE:\n\n{content}\n\n"
        f"Agent Alpha has argued this is REAL:\n{alpha_argument}\n\n"
        "Now argue the OPPOSITE — that this content is FAKE or MISLEADING."
    )
    return await call_llm_json(prompt, BETA_SYSTEM_PROMPT)


async def beta_rebuttal(content: str, alpha_rebuttal_arg: dict) -> dict:
    """Beta rebuts Alpha's rebuttal."""
    prompt = (
        f"NEWS CONTENT:\n\n{content}\n\n"
        f"Agent Alpha rebutted with:\n{alpha_rebuttal_arg}\n\n"
        "Now rebut Alpha's rebuttal and strengthen your case that the content is FAKE or MISLEADING."
    )
    return await call_llm_json(prompt, BETA_SYSTEM_PROMPT)
