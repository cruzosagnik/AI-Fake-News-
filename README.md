# 🔍 VerifyX

> **Detect Misinformation. Defend the Truth.**

An explainable AI-powered fake news detection platform. Uses a **6-agent AI pipeline** plus an advanced **AgentDebate Mode** powered by **Groq (Llama 3.3 70B)** + **HuggingFace** models with intelligent fallback heuristics.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              React 19 Frontend (Vite + TypeScript)          │
│   Landing · Analyze · News · Dashboard · AgentDebate · Auth │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼─────────────────────────────────────┐
│              FastAPI Backend (Python 3.11)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              6-Agent Standard Pipeline               │   │
│  │  A: Claim Extractor  → Groq / Llama 3.3 70B          │   │
│  │  B: Category Detect  → Keyword heuristics            │   │
│  │  C: Source Verifier  → Source registry               │   │
│  │  D: Bias Detector    → HuggingFace sentiment         │   │
│  │  E: Semantic Verify  → HuggingFace similarity        │   │
│  │  F: Verdict Agent    → Weighted score formula        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           AgentDebate Mode (NEW)                     │   │
│  │  α: Agent Alpha   → Defends content as REAL          │   │
│  │  β: Agent Beta    → Prosecutes content as FAKE       │   │
│  │  γ: Agent Gamma   → Neutral judge, delivers verdict  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Services: Groq API · HuggingFace API · OCR · PDF           │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  MongoDB Atlas                              │
│            users · analyses collections                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification Modes

### Standard Mode — 6-Agent Pipeline

| Agent | Role | Implementation |
|-------|------|----------------|
| **A — Claim Extractor** | Extracts claims, category, credibility score, bias indicators, suspicious patterns, and verdict signal in **one** LLM call | Groq `llama-3.3-70b-versatile` |
| **B — Category Detector** | Classifies news category using keyword heuristics | No API call |
| **C — Source Verifier** | Checks source credibility against a trust registry | No API call |
| **D — Bias Detector** | Detects emotional language and clickbait signals | HuggingFace Inference API |
| **E — Semantic Verifier** | Measures semantic similarity across claims | HuggingFace Inference API |
| **F — Verdict Agent** | Combines all signals using a weighted formula | Pure Python — no extra LLM call |

> **Optimised for cost:** Only **1 Groq/LLM call** per analysis. All downstream agents reuse Agent A's shared output.

### AgentDebate Mode — Adversarial Multi-Agent Verification

> *"Standard mode gives you an answer. Debate Mode shows you the thinking — two AIs argue, a third decides."*

| Agent | Role | Stance |
|-------|------|--------|
| **α — Agent Alpha** | Professional fact-checker who builds the strongest case for authenticity | **REAL** (Defender) |
| **β — Agent Beta** | Misinformation analyst who finds every reason to doubt the content | **FAKE** (Prosecutor) |
| **γ — Agent Gamma** | Neutral senior judge who evaluates both arguments blindly and delivers the final verdict | **Judge** |

**Debate Flow (1 Round):**
```
Content
  ↓
Alpha Opening  →  Beta sees Alpha → Beta Opening
  ↓
Alpha Rebuttal →  Beta sees Rebuttal → Beta Rebuttal
  ↓
Gamma receives full blind transcript → Final Verdict
```

**Double Round** (2 rounds): adds a second exchange before Gamma judges.

| Mode | Best for | Speed |
|------|----------|-------|
| Standard (6-agent) | Fast checks · clear misinformation · social posts | ~3s |
| AgentDebate (1 round) | Nuanced stories · political news · contested claims | ~20s |
| AgentDebate (2 rounds) | High-stakes verification · deep analysis | ~35s |

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows PowerShell
# source venv/bin/activate          # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
copy .env.example .env
# Edit .env with your API keys (see below)

# Start backend
.\venv\Scripts\uvicorn.exe app.main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173**

---

## Environment Variables

### `backend/.env`

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/truthlens
GROQ_API_KEY=gsk_...            # https://console.groq.com/keys
GROQ_MODEL=llama-3.3-70b-versatile   # optional, this is the default
HUGGINGFACE_API_KEY=hf_...      # https://huggingface.co/settings/tokens
JWT_SECRET=your_random_secret_here
FRONTEND_URL=http://localhost:5173
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

> **Note:** The backend runs without MongoDB (guest mode — results not saved). Groq key is required for both Standard and AgentDebate modes. Without HuggingFace, fallback heuristics are used automatically.

---

## API Endpoints

### Standard Analysis

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/analyze-text` | Optional | Analyze raw text |
| POST | `/analyze-url` | Optional | Scrape & analyze URL |
| POST | `/upload-pdf` | Optional | Extract & analyze PDF |
| POST | `/ocr-image` | Optional | OCR image & analyze |
| GET | `/history` | Required | User's past analyses (last 50) |
| GET | `/analytics` | — | Aggregated stats |
| GET | `/categories` | — | Category breakdown |
| GET | `/trend` | — | 7-day verdict trend |
| GET | `/trending-topics` | — | Top suspicious claims |
| GET | `/health` | — | Health check |

### AgentDebate Mode

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/debate/debate-analyze` | — | Run adversarial multi-agent debate |

**Request:**
```json
{
  "text": "news content here",
  "rounds": 1
}
```

**Response:**
```json
{
  "mode": "debate",
  "rounds_conducted": 1,
  "alpha_argument": { "stance": "REAL", "confidence": 78, "arguments": [...] },
  "beta_argument":  { "stance": "FAKE", "confidence": 82, "arguments": [...] },
  "alpha_rebuttal": { ... },
  "beta_rebuttal":  { ... },
  "gamma_verdict": {
    "alpha_score": 72, "beta_score": 81,
    "stronger_side": "Beta",
    "verdict": "Misleading",
    "authenticity_score": 38,
    "confidence": 74,
    "reasoning": "...",
    "key_deciding_factor": "...",
    "dissenting_note": "..."
  },
  "final_verdict": "Misleading",
  "authenticity_score": 38,
  "debate_transcript": [ ... ],
  "processing_time_ms": 18420,
  "incomplete_debate": false
}
```

Interactive docs: **http://localhost:8000/docs**

---

## Weighted Scoring Formula (Standard Mode)

```python
# Agent F — verdict_agent.py
authenticity_score = (
  gemini_reasoning_score    * 0.35 +   # Groq/LLM credibility score
  source_credibility_score  * 0.25 +
  semantic_similarity_score * 0.20 +
  (100 - bias_score)        * 0.10 +
  (100 - clickbait_score)   * 0.10
)

# Score is then anchored to the LLM's explicit verdict signal:
#   adjusted = (raw_score * 0.30) + (llm_anchor * 0.70)

# Verdict bands:
# 75–100 → Real
# 50–74  → Partially True
# 25–49  → Misleading
# 0–24   → Fake
```

Confidence is **85%** when the LLM verdict signal and the weighted score agree, **60%** when they differ.

---

## HuggingFace Models

| Model | Purpose |
|-------|---------|
| `sentence-transformers/all-MiniLM-L6-v2` | Semantic similarity (Agent E) |
| `cardiffnlp/twitter-roberta-base-sentiment` | Bias / sentiment (Agent D) |
| `hamzab/roberta-fake-news-classification` | Fake news fallback signal (Agent A) |

---

## Fallback Behaviour

When the Groq API is unavailable or rate-limited, Agent A automatically falls back to:

1. **HuggingFace fake-news classifier** (`hamzab/roberta-fake-news-classification`) — used when confidence ≥ 65%.
2. **Local heuristic patterns** — keyword matching against known misinformation phrases.
3. **Conservative default** — `PARTIALLY_TRUE` with a recommendation for manual review.

A 15-second cooldown is applied on rate limits; 30 seconds on network errors.

AgentDebate Mode applies a **12-second timeout per agent call**. If any agent fails mid-debate, a partial result is returned with `"incomplete_debate": true`.

---

## Frontend Pages & Components

| Page | Route | Auth | Description |
|------|-------|------|-------------|
| Landing | `/` | Public | Hero, input panel, stats, pipeline overview |
| Analyze | `/analyze` | Public | Full 6-agent results page |
| AgentDebate | `/debate` | Public | Adversarial debate analysis page |
| News Feed | `/news` | Public | Live news with breaking banner |
| Dashboard | `/dashboard` | Protected | User history & analytics |
| Login | `/login` | Public | JWT login |
| Register | `/register` | Public | Account creation |

Key components: `AgentTimeline`, `AuthenticityMeter`, `VerdictCard`, `ClaimsBreakdown`, `ScoreRadar`, `SourceTrustChart`, `BreakingNewsBanner`, `NewsCard`.

---

## Deployment

### Vercel (Frontend)
```bash
npm run build
# Set env: VITE_API_URL=https://your-backend.onrender.com
```

### Render (Backend)
```
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port 10000
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 |
| Animations | Framer Motion |
| Backend | FastAPI (Python 3.11) |
| Database | MongoDB Atlas (Motor async driver) |
| Primary AI | Groq API — `llama-3.3-70b-versatile` |
| NLP Models | HuggingFace Inference API |
| OCR | pytesseract + Pillow |
| PDF | PyPDF2 |
| Web Scraper | newspaper3k + BeautifulSoup4 |
| Auth | JWT (python-jose) + bcrypt |

---

## Project Structure

```
AI-Fake-News-/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── debate/                  # AgentDebate Mode (NEW)
│   │   │   │   ├── alpha_agent.py       # α — Defender (REAL)
│   │   │   │   ├── beta_agent.py        # β — Prosecutor (FAKE)
│   │   │   │   ├── gamma_agent.py       # γ — Neutral Judge
│   │   │   │   └── debate_orchestrator.py
│   │   │   ├── claim_extractor.py       # Agent A — Groq LLM
│   │   │   ├── category_detector.py     # Agent B — heuristics
│   │   │   ├── source_verifier.py       # Agent C — registry
│   │   │   ├── bias_detector.py         # Agent D — HuggingFace
│   │   │   ├── semantic_verifier.py     # Agent E — HuggingFace
│   │   │   └── verdict_agent.py         # Agent F — weighted score
│   │   ├── api/
│   │   │   ├── analyze.py               # Standard analysis routes
│   │   │   ├── debate.py                # POST /debate/debate-analyze (NEW)
│   │   │   └── auth.py                  # JWT auth routes
│   │   ├── services/
│   │   │   ├── llm_service.py           # Groq API client (shared)
│   │   │   ├── huggingface_service.py   # HF Inference API
│   │   │   ├── scraper_service.py       # URL scraper
│   │   │   └── ocr_service.py           # OCR + PDF
│   │   ├── database/                    # MongoDB Motor client
│   │   ├── models/                      # Pydantic models
│   │   ├── utils/                       # Scoring, language detection
│   │   └── main.py                      # FastAPI app entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AnalyzePage.tsx
│   │   │   ├── DebatePage.tsx           # AgentDebate UI (NEW)
│   │   │   ├── NewsPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── components/                  # Reusable UI components
│   │   ├── hooks/                       # AuthProvider, useAnalysis, useAuth
│   │   ├── lib/                         # API client utilities
│   │   └── types/                       # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── debate_agents_prompt.md              # AgentDebate design spec
└── sample_test_data.json               # Test cases (EN / HI / BN)
```

---

*Built for National/International Hackathons · AI Track · Misinformation Challenge*
*Stack: Groq Llama 3.3 70B · FastAPI · React · MongoDB · HuggingFace*