from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class AgentBreakdownModel(BaseModel):
    claimExtractor: Dict[str, Any]
    categoryDetector: Dict[str, Any]
    sourceVerifier: Dict[str, Any]
    biasDetector: Dict[str, Any]
    semanticVerifier: Dict[str, Any]
    verdictAgent: Dict[str, Any]


class AnalysisResult(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    content: str
    category: str
    language: str
    verdict: str
    authenticityScore: float
    confidenceScore: float
    biasScore: float
    clickbaitScore: float
    explanation: str
    suspiciousClaims: List[str]
    sourcesChecked: List[str]
    agentBreakdown: Dict[str, Any]
    createdAt: datetime = datetime.utcnow()


class AnalyzeTextRequest(BaseModel):
    text: str
    language: Optional[str] = "en"


class AnalyzeUrlRequest(BaseModel):
    url: str
    language: Optional[str] = "en"
