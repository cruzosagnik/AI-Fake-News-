"""
Debate Orchestrator
Runs the full adversarial debate loop between Alpha, Beta, and Gamma agents.
"""
import time
import asyncio
from app.agents.debate import alpha_agent, beta_agent, gamma_agent


async def run_debate(content: str, rounds: int = 1) -> dict:
    """
    Orchestrates the full debate:
      Round 1:
        Alpha opening → Beta sees it → Beta opening
        Alpha sees Beta → Alpha rebuttal → Beta sees it → Beta rebuttal
      Round 2 (optional):
        Alpha rebuttal of Beta rebuttal
        Beta rebuttal of Alpha rebuttal
      Final:
        Gamma receives the full transcript and delivers verdict.

    Returns a DebateResult-compatible dict.
    """
    start_ms = int(time.time() * 1000)
    transcript = []
    incomplete = False

    try:
        # Turn 1 — Alpha opening
        a_opening = await asyncio.wait_for(
            alpha_agent.alpha_opening(content), timeout=12.0
        )
        transcript.append({"turn": 1, "agent": "Alpha", "role": "opening", "content": a_opening})
    except Exception as e:
        return _partial_result(transcript, start_ms, str(e))

    try:
        # Turn 2 — Beta opening (sees Alpha's argument)
        b_opening = await asyncio.wait_for(
            beta_agent.beta_opening(content, a_opening), timeout=12.0
        )
        transcript.append({"turn": 2, "agent": "Beta", "role": "opening", "content": b_opening})
    except Exception as e:
        return _partial_result(transcript, start_ms, str(e))

    try:
        # Turn 3 — Alpha rebuttal (sees Beta's opening)
        a_rebuttal = await asyncio.wait_for(
            alpha_agent.alpha_rebuttal(content, b_opening), timeout=12.0
        )
        transcript.append({"turn": 3, "agent": "Alpha", "role": "rebuttal", "content": a_rebuttal})
    except Exception as e:
        return _partial_result(transcript, start_ms, str(e))

    try:
        # Turn 4 — Beta rebuttal (sees Alpha's rebuttal)
        b_rebuttal = await asyncio.wait_for(
            beta_agent.beta_rebuttal(content, a_rebuttal), timeout=12.0
        )
        transcript.append({"turn": 4, "agent": "Beta", "role": "rebuttal", "content": b_rebuttal})
    except Exception as e:
        return _partial_result(transcript, start_ms, str(e))

    # Round 2 — additional rebuttal exchange (if requested)
    a_r2 = a_rebuttal
    b_r2 = b_rebuttal
    if rounds == 2:
        try:
            a_r2 = await asyncio.wait_for(
                alpha_agent.alpha_rebuttal(content, b_rebuttal), timeout=12.0
            )
            transcript.append({"turn": 5, "agent": "Alpha", "role": "round2_rebuttal", "content": a_r2})

            b_r2 = await asyncio.wait_for(
                beta_agent.beta_rebuttal(content, a_r2), timeout=12.0
            )
            transcript.append({"turn": 6, "agent": "Beta", "role": "round2_rebuttal", "content": b_r2})
        except Exception:
            # Round 2 failure is non-fatal — fall through to Gamma with what we have
            incomplete = True

    try:
        # Final — Gamma judges the full blind transcript
        verdict = await asyncio.wait_for(
            gamma_agent.gamma_verdict(content, a_opening, b_opening, a_r2, b_r2),
            timeout=12.0,
        )
        transcript.append({"turn": len(transcript) + 1, "agent": "Gamma", "role": "verdict", "content": verdict})
    except Exception as e:
        return _partial_result(transcript, start_ms, str(e))

    elapsed_ms = int(time.time() * 1000) - start_ms

    return {
        "mode": "debate",
        "rounds_conducted": rounds,
        "alpha_argument": a_opening,
        "beta_argument": b_opening,
        "alpha_rebuttal": a_r2,
        "beta_rebuttal": b_r2,
        "gamma_verdict": verdict,
        "final_verdict": verdict.get("verdict", "Unknown"),
        "authenticity_score": verdict.get("authenticity_score", 50),
        "debate_transcript": transcript,
        "processing_time_ms": elapsed_ms,
        "incomplete_debate": incomplete,
    }


def _partial_result(transcript: list, start_ms: int, error: str) -> dict:
    """Return a partial result when the debate cannot complete."""
    elapsed_ms = int(time.time() * 1000) - start_ms
    return {
        "mode": "debate",
        "rounds_conducted": 0,
        "alpha_argument": {},
        "beta_argument": {},
        "alpha_rebuttal": {},
        "beta_rebuttal": {},
        "gamma_verdict": {},
        "final_verdict": "Unknown",
        "authenticity_score": 0,
        "debate_transcript": transcript,
        "processing_time_ms": elapsed_ms,
        "incomplete_debate": True,
        "error": error,
    }
