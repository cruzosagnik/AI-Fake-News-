# VerifyX — Debate Mode: Multi-Agent Verification Prompt

> Add this as a new verification mode to the existing VerifyX project.
> Do NOT modify the existing 6-agent pipeline. This is an additive feature.

---

## CONCEPT

**Debate Mode** is an advanced verification strategy where:
- **Agent Alpha** argues the content is REAL (defense)
- **Agent Beta** argues the content is FAKE (prosecution)
- **Agent Gamma** is the neutral judge who evaluates both arguments and delivers the final verdict

This mirrors real-world adversarial fact-checking used by legal and journalistic systems.

---

## TASK

Add a new `debate_mode` module to the existing VerifyX FastAPI backend and a new UI toggle on the frontend to activate it.

---

## BACKEND — ADD THESE FILES ONLY

```
backend/app/agents/
└── debate/
    ├── alpha_agent.py      # Defends: argues content is REAL
    ├── beta_agent.py       # Prosecutes: argues content is FAKE
    ├── gamma_agent.py      # Judge: evaluates debate, gives verdict
    └── debate_orchestrator.py  # Runs the full debate loop
```

```
backend/app/api/
└── debate.py              # POST /debate-analyze endpoint
```

---

## AGENT ROLES & PROMPTS

### Agent Alpha — The Defender
```python
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
```

---

### Agent Beta — The Prosecutor
```python
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
```

---

### Agent Gamma — The Judge
```python
GAMMA_SYSTEM_PROMPT = """
You are Agent Gamma, a neutral senior fact-checking judge.
You have just observed a structured debate between two AI agents about the authenticity of a news article.

Agent Alpha argued it is REAL.
Agent Beta argued it is FAKE.

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
```

---

## DEBATE ORCHESTRATOR

```python
# debate_orchestrator.py

async def run_debate(content: str, rounds: int = 1) -> DebateResult:
    """
    Round 1:
      - Alpha argues → Beta sees Alpha's argument → Beta responds
      - Beta argues → Alpha sees Beta's argument → Alpha responds
    Round 2 (optional, if rounds=2):
      - Alpha rebuts Beta's response
      - Beta rebuts Alpha's response
    Final:
      - Gamma receives full debate transcript and delivers verdict
    """
```

### Debate Flow (Single Round)
```
content
  ↓
Alpha Agent → opening_argument (JSON)
  ↓
Beta Agent (sees Alpha's argument) → opening_argument (JSON)
  ↓
Alpha Agent (sees Beta's argument) → rebuttal (JSON)
  ↓
Beta Agent (sees Alpha's rebuttal) → rebuttal (JSON)
  ↓
Gamma Judge (full transcript) → final_verdict (JSON)
```

### Debate Flow (Double Round — stronger mode)
```
content
  ↓
Round 1: Alpha opening → Beta opening
  ↓
Round 2: Alpha rebuttal → Beta rebuttal
  ↓
Gamma Judge (full 4-message transcript) → final_verdict
```

---

## NEW API ENDPOINT

```python
# backend/app/api/debate.py

POST /debate-analyze

Request:
{
  "text": "news content here",
  "rounds": 1   # 1 (fast) or 2 (thorough)
}

Response:
{
  "mode": "debate",
  "rounds_conducted": 1,
  "alpha_argument": { ...Agent Alpha JSON output },
  "beta_argument":  { ...Agent Beta JSON output  },
  "alpha_rebuttal": { ...Agent Alpha rebuttal    },
  "beta_rebuttal":  { ...Agent Beta rebuttal     },
  "gamma_verdict":  { ...Agent Gamma JSON output },
  "final_verdict":  "Real | Fake | Misleading | Partially True",
  "authenticity_score": <int 0-100>,
  "debate_transcript": [ ...ordered list of debate turns ],
  "processing_time_ms": <int>
}
```

---

## PYDANTIC MODELS

```python
class DebateRequest(BaseModel):
    text: str = Field(..., min_length=30, max_length=5000)
    rounds: int = Field(default=1, ge=1, le=2)

class DebateArgument(BaseModel):
    stance: str
    confidence: int
    arguments: list[str]
    weaknesses_acknowledged: str

class GammaVerdict(BaseModel):
    alpha_score: int
    beta_score: int
    stronger_side: str
    verdict: str
    authenticity_score: int
    confidence: int
    reasoning: str
    key_deciding_factor: str
    dissenting_note: str

class DebateResult(BaseModel):
    mode: str = "debate"
    rounds_conducted: int
    alpha_argument: dict
    beta_argument: dict
    alpha_rebuttal: dict
    beta_rebuttal: dict
    gamma_verdict: GammaVerdict
    final_verdict: str
    authenticity_score: int
    debate_transcript: list[dict]
    processing_time_ms: int
```

---

## LLM CALLS — USE EXISTING GROQ SERVICE

```python
# Reuse backend/app/services/llm_service.py
# Make 4-5 sequential Groq calls per debate (1 per turn + 1 for Gamma)
# Pass full conversation history to each subsequent agent

messages_for_beta = [
    {"role": "system", "content": BETA_SYSTEM_PROMPT},
    {"role": "user",   "content": f"NEWS: {content}"},
    {"role": "user",   "content": f"Alpha argued: {alpha_output}. Now argue the opposite."}
]

messages_for_gamma = [
    {"role": "system", "content": GAMMA_SYSTEM_PROMPT},
    {"role": "user",   "content": f"""
        NEWS CONTENT: {content}
        ALPHA OPENING: {alpha_opening}
        BETA OPENING:  {beta_opening}
        ALPHA REBUTTAL:{alpha_rebuttal}
        BETA REBUTTAL: {beta_rebuttal}
        Deliver your final verdict now.
    """}
]
```

---

## FRONTEND — DEBATE MODE UI

### Toggle in Analyze Page
Add a mode switcher above the analyze button:

```
[ Standard Mode ]  [ ⚔ Debate Mode ]
```

### Debate Result UI Layout

```
┌─────────────────────────────────────────────────────┐
│  ⚔ DEBATE MODE RESULT                               │
├──────────────────────┬──────────────────────────────┤
│   🟢 Agent Alpha     │   🔴 Agent Beta               │
│   DEFENDING: REAL    │   PROSECUTING: FAKE           │
│                      │                               │
│   Confidence: 78%    │   Confidence: 82%             │
│                      │                               │
│   Arguments:         │   Arguments:                  │
│   · arg 1            │   · arg 1                     │
│   · arg 2            │   · arg 2                     │
│   · arg 3            │   · arg 3                     │
│                      │                               │
│   Rebuttal:          │   Rebuttal:                   │
│   · rebuttal 1       │   · rebuttal 1                │
├──────────────────────┴──────────────────────────────┤
│              ⚖ Agent Gamma — Judge                  │
│                                                     │
│   Alpha score: ████████░░  78                       │
│   Beta score:  ██████████  82  ← stronger           │
│                                                     │
│   Key deciding factor:                              │
│   "Beta correctly identified the lack of..."        │
│                                                     │
│   Dissenting note:                                  │
│   "Alpha's point about X was valid but..."          │
│                                                     │
│   ┌─────────────────────────────────┐               │
│   │  VERDICT: MISLEADING  🟠        │               │
│   │  Authenticity: 42/100           │               │
│   │  Confidence:   74%              │               │
│   └─────────────────────────────────┘               │
└─────────────────────────────────────────────────────┘
```

### Debate Transcript Accordion
Below the result, show a collapsible full transcript:
```
▼ Full Debate Transcript
  Turn 1 — Alpha Opening
  Turn 2 — Beta Opening
  Turn 3 — Alpha Rebuttal
  Turn 4 — Beta Rebuttal
  Turn 5 — Gamma Verdict
```

---

## DESIGN TOKENS FOR DEBATE MODE

```css
/* Alpha (defender) */
--alpha-color: #10b981;   /* emerald */
--alpha-bg:    rgba(16, 185, 129, 0.08);

/* Beta (prosecutor) */
--beta-color:  #ef4444;   /* red */
--beta-bg:     rgba(239, 68, 68, 0.08);

/* Gamma (judge) */
--gamma-color: #a855f7;   /* violet */
--gamma-bg:    rgba(168, 85, 247, 0.08);
```

---

## WHEN TO USE DEBATE MODE

| Mode | Use case |
|---|---|
| Standard (6-agent) | Fast check · clear misinformation · social media posts |
| Debate Mode | Nuanced stories · political news · contested claims · high-stakes verification |

Add a tooltip on the toggle: *"Debate Mode runs 3 AI agents in adversarial debate for deeper analysis. Takes ~10s longer."*

---

## QUALITY REQUIREMENTS

- Each Groq call has 12-second timeout
- Full debate completes in under 30 seconds
- If any agent fails mid-debate, return partial result with `"incomplete_debate": true`
- Gamma must never see which agent is Alpha or Beta (blind judging) — label them only as "Agent 1" and "Agent 2" in the Gamma prompt
- Store debate results in MongoDB under `analyses` collection with `"mode": "debate"` field

---

## HACKATHON PITCH LINE

> *"Standard mode gives you an answer. Debate Mode shows you the thinking — two AIs argue, a third decides. It's adversarial AI for adversarial information."*

---

*VerifyX · Debate Mode · Adversarial Multi-Agent Verification*
*Stack: Groq Llama 3.3 70B · FastAPI · React · Existing VerifyX pipeline*
