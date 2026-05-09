import os
import json
import httpx
import time
import asyncio
from typing import Optional

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

_RATE_LIMITED_UNTIL = 0.0
_OFFLINE_UNTIL = 0.0
RATE_LIMIT_COOLDOWN_SECONDS = 15
NETWORK_COOLDOWN_SECONDS = 30

class LLMRateLimitError(ValueError):
    """Raised when LLM quota/rate limits are active."""

class LLMServiceUnavailableError(ValueError):
    """Raised when LLM cannot be reached due to local/network issues."""

def _rate_limit_seconds(response: httpx.Response) -> int:
    retry_after = response.headers.get("Retry-After")
    if retry_after and retry_after.replace(".", "", 1).isdigit():
        return max(int(float(retry_after)), RATE_LIMIT_COOLDOWN_SECONDS)
    return RATE_LIMIT_COOLDOWN_SECONDS

async def call_llm(prompt: str, system_instruction: Optional[str] = None, retries: int = 3) -> str:
    """Call Groq API with retry on rate limit."""
    global _RATE_LIMITED_UNTIL, _OFFLINE_UNTIL

    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set in .env")

    if time.monotonic() < _RATE_LIMITED_UNTIL:
        remaining = int(_RATE_LIMITED_UNTIL - time.monotonic())
        raise LLMRateLimitError(f"Groq API is cooling down for {remaining}s")

    if time.monotonic() < _OFFLINE_UNTIL:
        remaining = int(_OFFLINE_UNTIL - time.monotonic())
        raise LLMServiceUnavailableError(f"Groq network is cooling down for {remaining}s")

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "response_format": {"type": "json_object"}
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(GROQ_URL, json=payload, headers=headers)
        except httpx.TransportError as e:
            _OFFLINE_UNTIL = time.monotonic() + NETWORK_COOLDOWN_SECONDS
            raise LLMServiceUnavailableError(
                f"Groq network unavailable; using fallback for {NETWORK_COOLDOWN_SECONDS}s"
            ) from e

        # Handle rate limiting with cooldown and wait
        if response.status_code == 429:
            cooldown = min(_rate_limit_seconds(response), 15)
            if attempt < retries - 1:
                print(f"[LLM] Rate limited. Waiting {cooldown}s before retry {attempt + 1}/{retries}...")
                await asyncio.sleep(cooldown)
                continue
            else:
                _RATE_LIMITED_UNTIL = time.monotonic() + cooldown
                raise LLMRateLimitError(f"Groq API is rate limited; using fallback for {cooldown}s")

        if response.status_code != 200:
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            print("Groq Error Response:", response.text)
            response.raise_for_status()

        data = response.json()

        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise ValueError(f"Unexpected Groq response: {data}") from e

    raise ValueError("Groq API rate limit exceeded after retries")


async def call_llm_json(prompt: str, system_instruction: Optional[str] = None) -> dict:
    """Call Groq and parse JSON from the response."""
    raw = await call_llm(prompt, system_instruction)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        cleaned = "\n".join(lines).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse JSON from Groq response: {cleaned[:200]}")
