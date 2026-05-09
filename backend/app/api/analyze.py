from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import datetime
import uuid

from app.models.analysis import AnalyzeTextRequest, AnalyzeUrlRequest
from app.services.scraper_service import scrape_url
from app.services.ocr_service import extract_text_from_image, extract_text_from_pdf
from app.utils.language_detector import detect_language
from app.agents.claim_extractor import extract_claims
from app.agents.category_detector import detect_category
from app.agents.source_verifier import verify_sources
from app.agents.bias_detector import detect_bias
from app.agents.semantic_verifier import verify_semantics
from app.agents.verdict_agent import generate_verdict
from app.database.mongo import get_db
from app.api.auth import decode_token

router = APIRouter()
security = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[str]:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return payload.get("sub")
    except Exception:
        return None


async def run_pipeline(content: str, language: Optional[str] = None) -> dict:
    """Execute the full 6-agent pipeline. Only ONE Gemini call total."""
    if not language or language == "auto":
        language = detect_language(content)

    # Agent A — ONE consolidated Gemini call (claims + category + credibility + reasoning)
    extraction = await extract_claims(content, language)
    claims = extraction.get("claims", [])

    # Agent B — keyword heuristic (no API call)
    category = detect_category(content, extraction.get("category", "other"))

    # Agent C — source registry (no API call)
    source = await verify_sources(content, category, claims)

    # Agent D — HuggingFace sentiment (no Gemini)
    bias = await detect_bias(content, extraction.get("bias_indicators", []))

    # Agent E — HuggingFace similarity (no Gemini)
    semantics = await verify_semantics(content, claims)

    # Agent F — combine all signals (no extra Gemini call)
    verdict = generate_verdict(extraction, source, bias, semantics)

    return {
        "language": language,
        "category": category,
        "verdict": verdict["verdict"],
        "authenticityScore": verdict["authenticityScore"],
        "confidenceScore": verdict["confidenceScore"],
        "biasScore": bias.get("biasScore", 30),
        "clickbaitScore": bias.get("clickbaitScore", 20),
        "explanation": verdict["explanation"],
        "suspiciousClaims": verdict.get("suspiciousClaims", []),
        "sourcesChecked": source.get("sources", []),
        "agentBreakdown": {
            "claimExtractor": {
                "claims": claims,
                "status": extraction.get("status", "success"),
            },
            "categoryDetector": {
                "category": category,
                "confidence": 0.85,
            },
            "sourceVerifier": {
                "sources": source.get("sources", []),
                "trustScore": source.get("trustScore", 35),
            },
            "biasDetector": {
                "biasScore": bias.get("biasScore", 30),
                "clickbaitScore": bias.get("clickbaitScore", 20),
                "sentiment": bias.get("sentiment", "neutral"),
            },
            "semanticVerifier": {
                "similarityScore": semantics.get("similarityScore", 50),
                "contradictions": semantics.get("contradictions", []),
            },
            "verdictAgent": {
                "agentScores": verdict.get("agentScores", {}),
                "verdictSignal": verdict["verdict"],
            },
        },
    }


async def save_analysis(db, content: str, result: dict, user_id: Optional[str] = None) -> str:
    analysis_id = str(uuid.uuid4())
    doc = {
        "_id": analysis_id,
        "userId": user_id,
        "content": content[:500],
        "category": result["category"],
        "language": result["language"],
        "verdict": result["verdict"],
        "authenticityScore": result["authenticityScore"],
        "confidenceScore": result["confidenceScore"],
        "biasScore": result["biasScore"],
        "clickbaitScore": result["clickbaitScore"],
        "explanation": result["explanation"],
        "suspiciousClaims": result["suspiciousClaims"],
        "sourcesChecked": result["sourcesChecked"],
        "agentBreakdown": result["agentBreakdown"],
        "createdAt": datetime.utcnow(),
    }
    try:
        if db is not None:
            await db["analyses"].insert_one(doc)
    except Exception as e:
        print(f"[DB] Save error: {e}")
    result["id"] = analysis_id
    result["content"] = content[:500]
    result["createdAt"] = doc["createdAt"].isoformat()
    return analysis_id


@router.post("/analyze-text")
async def analyze_text(request: AnalyzeTextRequest, user_id: Optional[str] = Depends(get_optional_user)):
    if not request.text or len(request.text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text is too short to analyze.")
    result = await run_pipeline(request.text, request.language)
    await save_analysis(get_db(), request.text, result, user_id)
    return result


@router.post("/analyze-url")
async def analyze_url(request: AnalyzeUrlRequest, user_id: Optional[str] = Depends(get_optional_user)):
    try:
        content = await scrape_url(request.url)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to scrape URL: {e}")
    if not content or len(content.strip()) < 10:
        raise HTTPException(status_code=422, detail="No readable content found at URL.")
    result = await run_pipeline(content, request.language)
    await save_analysis(get_db(), content, result, user_id)
    return result


@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), user_id: Optional[str] = Depends(get_optional_user)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    pdf_bytes = await file.read()
    content = await extract_text_from_pdf(pdf_bytes)
    result = await run_pipeline(content)
    await save_analysis(get_db(), content, result, user_id)
    return result


@router.post("/ocr-image")
async def ocr_image(file: UploadFile = File(...), user_id: Optional[str] = Depends(get_optional_user)):
    allowed = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
    ext = "." + file.filename.lower().rsplit(".", 1)[-1]
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported image format.")
    image_bytes = await file.read()
    content = await extract_text_from_image(image_bytes)
    result = await run_pipeline(content)
    await save_analysis(get_db(), content, result, user_id)
    return result


@router.get("/history")
async def get_history(user_id: Optional[str] = Depends(get_optional_user)):
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    db = get_db()
    if db is None:
        return {"analyses": [], "total": 0}
    cursor = db["analyses"].find({"userId": user_id}).sort("createdAt", -1).limit(50)
    analyses = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id", ""))
        if "createdAt" in doc and hasattr(doc["createdAt"], "isoformat"):
            doc["createdAt"] = doc["createdAt"].isoformat()
        analyses.append(doc)
    return {"analyses": analyses, "total": len(analyses)}


@router.get("/analytics")
async def get_analytics():
    db = get_db()
    if db is None:
        return _mock_analytics()
    try:
        total = await db["analyses"].count_documents({})
        
        cursor = db["analyses"].aggregate([{"$group": {"_id": None, "avg_accuracy": {"$avg": "$confidenceScore"}}}])
        agg_result = []
        async for doc in cursor:
            agg_result.append(doc)
        accuracy_rate = round(agg_result[0]["avg_accuracy"]) if agg_result and agg_result[0].get("avg_accuracy") else 94
        
        languages = await db["analyses"].distinct("language")
        languages_count = len(languages) if languages else 3

        return {
            "total": total,
            "fake": await db["analyses"].count_documents({"verdict": "Fake"}),
            "real": await db["analyses"].count_documents({"verdict": "Real"}),
            "misleading": await db["analyses"].count_documents({"verdict": "Misleading"}),
            "partiallyTrue": await db["analyses"].count_documents({"verdict": "Partially True"}),
            "accuracyRate": accuracy_rate,
            "languagesCount": languages_count,
        }
    except Exception as e:
        print(f"Error in get_analytics: {e}")
        return _mock_analytics()


@router.get("/categories")
async def get_categories():
    db = get_db()
    if db is None:
        return _mock_categories()
    try:
        pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
        results = {}
        async for doc in db["analyses"].aggregate(pipeline):
            results[doc["_id"]] = doc["count"]
        return results
    except Exception:
        return _mock_categories()


def _mock_analytics():
    return {"total": 1250000, "fake": 380000, "real": 620000, "misleading": 180000, "partiallyTrue": 70000, "accuracyRate": 94, "languagesCount": 3}


def _mock_categories():
    return {"politics": 320, "health": 280, "finance": 190, "sports": 160, "technology": 140, "environment": 90, "entertainment": 80, "science": 70, "religion": 60, "other": 50}


@router.get("/trend")
async def get_trend():
    db = get_db()
    if db is None:
        return _mock_trend()
    try:
        from datetime import datetime, timedelta
        import calendar
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        pipeline = [
            {"$match": {"createdAt": {"$gte": seven_days_ago}}},
            {"$project": {
                "dayOfWeek": {"$dayOfWeek": "$createdAt"},
                "verdict": 1
            }},
            {"$group": {
                "_id": {"dayOfWeek": "$dayOfWeek", "verdict": "$verdict"},
                "count": {"$sum": 1}
            }}
        ]
        
        results = {}
        async for doc in db["analyses"].aggregate(pipeline):
            day_num = doc["_id"]["dayOfWeek"] # 1 (Sun) to 7 (Sat)
            verdict = doc["_id"]["verdict"]
            count = doc["count"]
            if day_num not in results:
                results[day_num] = {"Real": 0, "Fake": 0, "Misleading": 0, "Partially True": 0}
            if verdict in results[day_num]:
                results[day_num][verdict] += count
                
        # Format the output to ensure we have exactly 7 days ending today
        today = datetime.utcnow()
        days_map = {1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"}
        formatted_trend = []
        for i in range(6, -1, -1):
            target_date = today - timedelta(days=i)
            # isoweekday() returns 1 (Mon) to 7 (Sun), MongoDB dayOfWeek returns 1 (Sun) to 7 (Sat)
            mongo_day = (target_date.isoweekday() % 7) + 1
            day_name = days_map[mongo_day][:3]
            stats = results.get(mongo_day, {"Real": 0, "Fake": 0, "Misleading": 0, "Partially True": 0})
            formatted_trend.append({
                "day": day_name,
                "Real": stats["Real"],
                "Fake": stats["Fake"],
                "Misleading": stats["Misleading"]
            })
        return formatted_trend
    except Exception as e:
        print(f"Error fetching trend: {e}")
        return _mock_trend()


@router.get("/trending-topics")
async def get_trending_topics():
    db = get_db()
    if db is None:
        return _mock_trending_topics()
    try:
        # Find the most common suspicious claims from the last 100 fake/misleading analyses
        cursor = db["analyses"].find({"verdict": {"$in": ["Fake", "Misleading"]}}).sort("createdAt", -1).limit(100)
        claims_freq = {}
        async for doc in cursor:
            for claim in doc.get("suspiciousClaims", []):
                if len(claim) > 10 and len(claim) < 60:
                    claims_freq[claim] = claims_freq.get(claim, 0) + 1
        
        if not claims_freq:
            # Fallback to category names if no claims
            return _mock_trending_topics()
            
        sorted_claims = sorted(claims_freq.items(), key=lambda x: x[1], reverse=True)
        top_claims = [claim[0] for claim in sorted_claims[:5]]
        
        if len(top_claims) < 5:
            top_claims.extend(_mock_trending_topics()[:5 - len(top_claims)])
            
        return top_claims
    except Exception:
        return _mock_trending_topics()


def _mock_trend():
    import random
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return [{"day": d, "Real": random.randint(20, 60), "Fake": random.randint(10, 40), "Misleading": random.randint(5, 25)} for d in days]

def _mock_trending_topics():
    return [
        'Climate Change Hoaxes',
        'Vaccine Misinformation',
        'Election Fraud Claims',
        'Crypto Scam Rumors',
        'Celebrity Death Hoaxes',
    ]
