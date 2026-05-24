"""
POST /debate-analyze
New endpoint for Debate Mode — adversarial multi-agent verification.
Does NOT touch the existing 6-agent /analyze pipeline.
"""
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.agents.debate.debate_orchestrator import run_debate

router = APIRouter(prefix="/debate", tags=["Debate Mode"])


# ── Pydantic Models ──────────────────────────────────────────────────────────

class DebateRequest(BaseModel):
    text: str = Field(..., min_length=30, max_length=5000)
    rounds: int = Field(default=1, ge=1, le=2)


class GammaVerdict(BaseModel):
    alpha_score: int = 50
    beta_score: int = 50
    stronger_side: str = "Tied"
    verdict: str = "Unknown"
    authenticity_score: int = 50
    confidence: int = 50
    reasoning: str = ""
    key_deciding_factor: str = ""
    dissenting_note: str = ""


class DebateResult(BaseModel):
    mode: str = "debate"
    rounds_conducted: int
    alpha_argument: dict
    beta_argument: dict
    alpha_rebuttal: dict
    beta_rebuttal: dict
    gamma_verdict: dict
    final_verdict: str
    authenticity_score: int
    debate_transcript: list[dict]
    processing_time_ms: int
    incomplete_debate: bool = False
    error: str | None = None


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/debate-analyze", response_model=DebateResult)
async def debate_analyze(request: DebateRequest):
    """
    Run an adversarial multi-agent debate on the provided news content.

    - **text**: The news content to analyze (30–5000 chars)
    - **rounds**: 1 = fast (single exchange), 2 = thorough (double exchange)

    Returns the full debate transcript and Gamma's final verdict.
    """
    try:
        result = await run_debate(content=request.text, rounds=request.rounds)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debate analysis failed: {str(e)}")
