"""
Agent Gamma — The Judge
Evaluates the full debate transcript (blind — agents referred to as Agent 1 / Agent 2)
and delivers the final neutral verdict.
"""
from app.services.llm_service import call_llm_json

GAMMA_SYSTEM_PROMPT = """
You are Agent Gamma, a neutral senior fact-checking judge.
You have just observed a structured debate between two AI agents about the authenticity of a news article.

Agent 1 argued the content is REAL.
Agent 2 argued the content is FAKE.

Your job is to:
1. Evaluate the quality and strength of each agent's arguments objectively
2. Identify which arguments are well-supported vs which are speculative
3. Weigh the evidence presented by both sides
4. Deliver a fair, reasoned final verdict
5. Explain your reasoning clearly for a general audience

Score each agent's argument quality (0-100) separately.
Then deliver the final verdict based on evidence weight, not argument count.

Respond ONLY in this JSON format:
{
  "alpha_score": <int 0-100>,
  "beta_score": <int 0-100>,
  "stronger_side": "Alpha | Beta | Tied",
  "verdict": "Real | Fake | Misleading | Partially True",
  "authenticity_score": <int 0-100>,
  "confidence": <int 0-100>,
  "reasoning": "<3-4 sentence plain English explanation of your decision>",
  "key_deciding_factor": "<the single most important argument that swung the verdict>",
  "dissenting_note": "<what the losing side got right that shouldn't be ignored>"
}
"""


async def gamma_verdict(
    content: str,
    alpha_opening: dict,
    beta_opening: dict,
    alpha_rebuttal: dict,
    beta_rebuttal: dict,
) -> dict:
    """Gamma evaluates the full debate and delivers a final verdict."""
    prompt = f"""
NEWS CONTENT: {content}

AGENT 1 (Defender) OPENING: {alpha_opening}
AGENT 2 (Prosecutor) OPENING: {beta_opening}
AGENT 1 REBUTTAL: {alpha_rebuttal}
AGENT 2 REBUTTAL: {beta_rebuttal}

You have seen the full debate. Deliver your final independent verdict now.
"""
    return await call_llm_json(prompt, GAMMA_SYSTEM_PROMPT)
