export interface AgentBreakdown {
  claimExtractor: { claims: string[]; status: string };
  categoryDetector: { category: string; confidence: number };
  sourceVerifier: { sources: string[]; trustScore: number };
  biasDetector: { biasScore: number; clickbaitScore: number; tone: string };
  semanticVerifier: { similarityScore: number; contradictions: string[] };
  verdictAgent: { reasoningScore: number; verdictSignal: string };
}

export interface AnalysisResult {
  id: string;
  content: string;
  category: string;
  language: 'en' | 'hi' | 'bn';
  verdict: 'Real' | 'Fake' | 'Misleading' | 'Partially True';
  authenticityScore: number;
  confidenceScore: number;
  biasScore: number;
  clickbaitScore: number;
  explanation: string;
  suspiciousClaims: string[];
  sourcesChecked: string[];
  agentBreakdown: AgentBreakdown;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AnalyticsData {
  total: number;
  fake: number;
  real: number;
  misleading: number;
  partiallyTrue: number;
  accuracyRate: number;
  languagesCount?: number;
}
