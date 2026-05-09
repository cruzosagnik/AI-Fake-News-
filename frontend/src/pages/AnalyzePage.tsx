import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, BookmarkPlus, Brain, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import VerdictCard from '../components/VerdictCard';
import AuthenticityMeter from '../components/AuthenticityMeter';
import AgentTimeline from '../components/AgentTimeline';
import SourceTrustChart from '../components/SourceTrustChart';
import ClaimsBreakdown from '../components/ClaimsBreakdown';
import ScoreRadar from '../components/ScoreRadar';
import CategoryBadge from '../components/CategoryBadge';
import type { AnalysisResult } from '../types';
import { motion } from 'framer-motion';

type StepStatus = 'pending' | 'running' | 'done' | 'failed';

const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  bn: '🇧🇩',
};

interface LocationState {
  result: AnalysisResult;
  steps: Array<{ id: string; label: string; status: StepStatus }>;
}

function ScoreCard({ label, score, invert = false }: { label: string; score: number; invert?: boolean }) {
  const display = invert ? Math.max(0, 100 - score) : score;
  const color =
    display >= 75 ? 'text-emerald-400' : display >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="glass-card p-4 text-center">
      <div className={`text-3xl font-black tabular-nums ${color}`}>
        {score.toFixed(0)}
      </div>
      <div className="text-gray-500 text-xs mt-1">{label}</div>
    </div>
  );
}

export default function AnalyzePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  if (!state?.result) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center text-center px-4">
        <div>
          <p className="text-gray-400 mb-4">No analysis data found.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm hover:bg-orange-500"
          >
            Start Analyzing
          </button>
        </div>
      </div>
    );
  }

  const { result, steps } = state;
  const agentBreakdown = result.agentBreakdown as unknown as Record<string, unknown>;
  const claims = (agentBreakdown?.claimExtractor as { claims: string[] })?.claims || [];
  const trustScore = (agentBreakdown?.sourceVerifier as { trustScore: number })?.trustScore || 50;

  const handleCopy = () => {
    const text = `TruthLens AI Verdict: ${result.verdict} (${result.authenticityScore.toFixed(0)}/100)\n\n${result.explanation}`;
    navigator.clipboard.writeText(text);
    toast.success('Result copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ── Top bar ──────────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-8 flex-wrap"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            New Analysis
          </button>
          <div className="flex-1" />
          <CategoryBadge category={result.category} />
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm">
            {LANG_FLAGS[result.language] || '🌐'} {result.language.toUpperCase()}
          </span>
          <VerdictCard verdict={result.verdict} size="sm" />
        </motion.div>

        {/* ── Hero row: Verdict + Meter ─────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Verdict */}
          <div className="glass-card p-8 flex flex-col items-center justify-center gap-4 border border-white/5 shadow-xl shadow-black/20">
            <VerdictCard verdict={result.verdict} size="lg" />
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-all">
                <BookmarkPlus className="w-3.5 h-3.5" />
                Save
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-all">
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
            </div>
          </div>

          {/* Authenticity Meter */}
          <div className="glass-card p-8 flex items-center justify-center border border-white/5 shadow-xl shadow-black/20">
            <AuthenticityMeter score={result.authenticityScore} />
          </div>

          {/* Score Radar */}
          <div className="glass-card p-4 border border-white/5 shadow-xl shadow-black/20">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 px-2">Score Radar</p>
            <ScoreRadar
              authenticityScore={result.authenticityScore}
              confidenceScore={result.confidenceScore}
              biasScore={result.biasScore}
              clickbaitScore={result.clickbaitScore}
            />
          </div>
        </motion.div>

        {/* ── Score Cards ────────────────────────── */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 }
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          <ScoreCard label="Authenticity" score={result.authenticityScore} />
          <ScoreCard label="Confidence" score={result.confidenceScore} />
          <ScoreCard label="Bias Score" score={result.biasScore} />
          <ScoreCard label="Clickbait Score" score={result.clickbaitScore} />
        </motion.div>

        {/* ── Main Content Grid ──────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Agent Timeline */}
          <div className="glass-card p-6 lg:row-span-2 border border-white/5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-orange-400" />
              Agent Pipeline
            </h2>
            <AgentTimeline steps={steps} agentBreakdown={agentBreakdown} />
          </div>

          {/* AI Explanation */}
          <div className="glass-card p-6 border border-white/5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
              🤖 AI Explanation
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
          </div>

          {/* Suspicious Claims */}
          <div className="glass-card p-6 border border-white/5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
              ⚠️ Claims Breakdown
            </h2>
            <ClaimsBreakdown
              claims={claims}
              suspiciousClaims={result.suspiciousClaims}
            />
          </div>

          {/* Source Trust */}
          <div className="glass-card p-6 border border-white/5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
              🔗 Source Trust Analysis
            </h2>
            <SourceTrustChart
              sources={result.sourcesChecked}
              trustScore={trustScore}
            />
          </div>

          {/* Content Preview */}
          <div className="glass-card p-6 border border-white/5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
              📄 Analyzed Content
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-6">
              {result.content}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
