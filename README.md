# 🔍 TruthLens AI

> **Detect Misinformation. Defend the Truth.**

An explainable AI-powered fake news detection platform built for hackathons. Uses a **6-agent AI pipeline** powered by Google Gemini 1.5 Flash + HuggingFace models.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                  │
│         Landing · Analyze · Dashboard · Auth            │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼─────────────────────────────────┐
│              FastAPI Backend (Python 3.11)               │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              6-Agent AI Pipeline                 │   │
│  │  A: Claim Extractor  → Gemini                   │   │
│  │  B: Category Detect  → Gemini + Keywords        │   │
│  │  C: Source Verifier  → Registry + Gemini        │   │
│  │  D: Bias Detector    → HuggingFace + Gemini     │   │
│  │  E: Semantic Verify  → sentence-transformers    │   │
│  │  F: Verdict Agent    → Gemini (weighted score)  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Services: Gemini API · HuggingFace API · OCR · PDF     │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  MongoDB Atlas                          │
│            users · analyses collections                 │
└─────────────────────────────────────────────────────────┘
```

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

Open **http://localhost:3000**

---

## Environment Variables

### `backend/.env`

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/truthlens
GEMINI_API_KEY=AIza...         # https://aistudio.google.com/app/apikey
HUGGINGFACE_API_KEY=hf_...     # https://huggingface.co/settings/tokens
JWT_SECRET=your_random_secret_here
FRONTEND_URL=http://localhost:3000
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

> **Note:** The backend runs without MongoDB (guest mode — results not saved) and without API keys (returns fallback scores). Add your keys to get full AI functionality.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze-text` | Analyze raw text |
| POST | `/analyze-url` | Scrape & analyze URL |
| POST | `/upload-pdf` | Extract & analyze PDF |
| POST | `/ocr-image` | OCR image & analyze |
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | JWT login |
| GET | `/history` | User's past analyses |
| GET | `/analytics` | Aggregated stats |
| GET | `/categories` | Category breakdown |

Interactive docs: **http://localhost:8000/docs**

---

## Weighted Scoring Formula

```python
authenticity_score = (
  gemini_reasoning_score    * 0.35 +
  source_credibility_score  * 0.25 +
  semantic_similarity_score * 0.20 +
  (100 - bias_score)        * 0.10 +
  (100 - clickbait_score)   * 0.10
)

# Verdict:
# 75–100 → Real
# 50–74  → Partially True
# 25–49  → Misleading
# 0–24   → Fake
```

---

## HuggingFace Models

| Model | Purpose |
|-------|---------|
| `sentence-transformers/all-MiniLM-L6-v2` | Semantic similarity |
| `cardiffnlp/twitter-roberta-base-sentiment` | Bias / sentiment |
| `hamzab/roberta-fake-news-classification` | Fake news signal |

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
| Frontend | React 18 + TypeScript + Tailwind CSS v4 |
| Backend | FastAPI (Python 3.11) |
| Database | MongoDB Atlas (Motor async driver) |
| Primary AI | Google Gemini 1.5 Flash |
| NLP Models | HuggingFace Inference API |
| OCR | pytesseract |
| Auth | JWT (python-jose) + bcrypt |
| Charts | Recharts |

---

*Built for National/International Hackathons · AI Track · Misinformation Challenge*