# 🔍 VerifyX

> **Detect Misinformation. Defend the Truth.**

An explainable AI-powered fake news detection platform. Uses a **6-agent AI pipeline** powered by **Groq (Llama 3.3 70B)** + **HuggingFace** models with intelligent fallback heuristics.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              React 19 Frontend (Vite + TypeScript)      │
│   Landing · Analyze · News · Dashboard · Auth           │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼─────────────────────────────────┐
│              FastAPI Backend (Python 3.11)              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              6-Agent AI Pipeline                 │   │
│  │  A: Claim Extractor  → Groq / Llama 3.3 70B      │   │
│  │  B: Category Detect  → Keyword heuristics        │   │
│  │  C: Source Verifier  → Source registry           │   │
│  │  D: Bias Detector    → HuggingFace sentiment     │   │
│  │  E: Semantic Verify  → HuggingFace similarity    │   │
│  │  F: Verdict Agent    → Weighted score formula    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Services: Groq API · HuggingFace API · OCR · PDF       │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  MongoDB Atlas                          │
│            users · analyses collections                 │
└─────────────────────────────────────────────────────────┘
```

---

## Pipeline Details

| Agent | Role | Implementation |
|-------|------|----------------|
| **A — Claim Extractor** | Extracts claims, category, credibility score, bias indicators, suspicious patterns, and verdict signal in **one** LLM call | Groq `llama-3.3-70b-versatile` |
| **B — Category Detector** | Classifies news category using keyword heuristics | No API call |
| **C — Source Verifier** | Checks source credibility against a trust registry | No API call |
| **D — Bias Detector** | Detects emotional language and clickbait signals | HuggingFace Inference API |
| **E — Semantic Verifier** | Measures semantic similarity across claims | HuggingFace Inference API |
| **F — Verdict Agent** | Combines all signals using a weighted formula | Pure Python — no extra LLM call |

> **Optimised for cost:** Only **1 Groq/LLM call** per analysis. All downstream agents reuse Agent A's shared output.

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
copy .env.example .env
# Edit .env with your API keys (see below)

# Start backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
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

> **Note:** The backend runs without MongoDB (guest mode — results not saved). Groq and HuggingFace keys are required for full AI functionality. Without them, fallback heuristics and the HuggingFace fake-news classifier are used automatically.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/analyze-text` | Optional | Analyze raw text |
| POST | `/analyze-url` | Optional | Scrape & analyze URL |
| POST | `/upload-pdf` | Optional | Extract & analyze PDF |
| POST | `/ocr-image` | Optional | OCR image & analyze |
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | JWT login |
| GET | `/history` | Required | User's past analyses (last 50) |
| GET | `/analytics` | — | Aggregated stats |
| GET | `/categories` | — | Category breakdown |
| GET | `/trend` | — | 7-day verdict trend |
| GET | `/trending-topics` | — | Top suspicious claims |
| GET | `/health` | — | Health check |

Interactive docs: **http://localhost:8000/docs**

---

## Weighted Scoring Formula

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
2. **Local heuristic patterns** — keyword matching against known misinformation phrases (e.g. *"cures cancer"*, *"doctors hate"*).
3. **Conservative default** — `PARTIALLY_TRUE` with a recommendation for manual review.

A 15-second cooldown is applied on rate limits; 30 seconds on network errors.

---

## Frontend Pages & Components

| Page | Route | Auth |
|------|-------|------|
| Landing | `/` | Public |
| Analyze | `/analyze` | Public |
| News Feed | `/news` | Public |
| Dashboard | `/dashboard` | Protected |
| Login | `/login` | Public |
| Register | `/register` | Public |

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
| Animations | Framer Motion + GSAP |
| UI Primitives | Radix UI (Accordion, Progress, Tabs) |
| Charts | Recharts |
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
│   │   ├── agents/            # 6-agent pipeline
│   │   │   ├── claim_extractor.py   # Agent A — Groq LLM
│   │   │   ├── category_detector.py # Agent B — heuristics
│   │   │   ├── source_verifier.py   # Agent C — registry
│   │   │   ├── bias_detector.py     # Agent D — HuggingFace
│   │   │   ├── semantic_verifier.py # Agent E — HuggingFace
│   │   │   └── verdict_agent.py     # Agent F — weighted score
│   │   ├── api/
│   │   │   ├── analyze.py     # Main analysis routes
│   │   │   └── auth.py        # JWT auth routes
│   │   ├── services/
│   │   │   ├── llm_service.py         # Groq API client
│   │   │   ├── huggingface_service.py # HF Inference API
│   │   │   ├── scraper_service.py     # URL scraper
│   │   │   └── ocr_service.py         # OCR + PDF
│   │   ├── database/          # MongoDB Motor client
│   │   ├── models/            # Pydantic models
│   │   ├── utils/             # Scoring, language detection
│   │   └── main.py            # FastAPI app entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/             # 6 pages
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # AuthProvider, useAnalysis, useAuth
│   │   ├── lib/               # API client utilities
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── sample_test_data.json      # Test cases (EN / HI / BN)
```

---

*Built for National/International Hackathons · AI Track · Misinformation Challenge*