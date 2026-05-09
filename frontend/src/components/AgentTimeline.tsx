import { CheckCircle, Loader2, XCircle, Clock } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'failed';
}

interface AgentTimelineProps {
  steps: Step[];
  agentBreakdown?: Record<string, unknown>;
}

const AGENT_DETAILS: Record<string, string> = {
  A: 'Extracting verifiable factual claims from the content',
  B: 'Classifying news into one of 10 topic categories',
  C: 'Cross-referencing sources against trusted domain registry',
  D: 'Detecting bias, propaganda, and clickbait patterns',
  E: 'Measuring semantic consistency of claims',
  F: 'Generating final weighted verdict with AI reasoning',
};

export default function AgentTimeline({ steps, agentBreakdown }: AgentTimelineProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
            step.status === 'running'
              ? 'bg-orange-500/10 border-orange-500/30 shadow-lg shadow-orange-500/10'
              : step.status === 'done'
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : step.status === 'failed'
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-white/3 border-white/5'
          }`}
        >
          {/* Status icon */}
          <div className="flex-shrink-0 mt-0.5">
            {step.status === 'done' && (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}
            {step.status === 'running' && (
              <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
            )}
            {step.status === 'failed' && (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            {step.status === 'pending' && (
              <Clock className="w-5 h-5 text-gray-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-gray-500">Agent {step.id}</span>
              <span
                className={`font-semibold text-sm ${
                  step.status === 'done'
                    ? 'text-emerald-400'
                    : step.status === 'running'
                    ? 'text-orange-300'
                    : step.status === 'failed'
                    ? 'text-red-400'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">{AGENT_DETAILS[step.id]}</p>

            {/* Show result snippet when done */}
            {step.status === 'done' && agentBreakdown && (
              <AgentResult id={step.id} breakdown={agentBreakdown} />
            )}
          </div>

          {/* Step number badge */}
          <div
            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step.status === 'done'
                ? 'bg-emerald-500/20 text-emerald-400'
                : step.status === 'running'
                ? 'bg-orange-500/20 text-orange-400 animate-pulse'
                : 'bg-white/5 text-gray-600'
            }`}
          >
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentResult({ id, breakdown }: { id: string; breakdown: Record<string, unknown> }) {
  const agentMap: Record<string, string> = {
    A: 'claimExtractor',
    B: 'categoryDetector',
    C: 'sourceVerifier',
    D: 'biasDetector',
    E: 'semanticVerifier',
    F: 'verdictAgent',
  };

  const key = agentMap[id];
  if (!key) return null;
  const data = breakdown[key] as Record<string, unknown> | undefined;
  if (!data) return null;

  const snippets: string[] = [];
  if (id === 'A' && Array.isArray(data.claims)) snippets.push(`${data.claims.length} claims extracted`);
  if (id === 'B') snippets.push(`Category: ${data.category} (${((data.confidence as number) * 100).toFixed(0)}%)`);
  if (id === 'C') snippets.push(`Trust Score: ${data.trustScore}/100`);
  if (id === 'D') snippets.push(`Bias: ${data.biasScore}/100 · Clickbait: ${data.clickbaitScore}/100`);
  if (id === 'E') snippets.push(`Similarity: ${(data.similarityScore as number).toFixed(1)}/100`);
  if (id === 'F') snippets.push(`Reasoning Score: ${data.reasoningScore}/100`);

  if (!snippets.length) return null;

  return (
    <p className="mt-1 text-xs text-gray-400 font-mono bg-white/3 rounded px-2 py-1">
      {snippets.join(' · ')}
    </p>
  );
}
