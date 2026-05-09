interface SourceTrustChartProps {
  sources: string[];
  trustScore: number;
}

function getDomainScore(domain: string, baseScore: number): number {
  const trusted = [
    'reuters.com', 'bbc.com', 'apnews.com', 'who.int', 'cdc.gov',
    'nih.gov', 'bloomberg.com', 'espn.com', 'thehindu.com', 'ndtv.com',
    'nasa.gov', 'mit.edu', 'pib.gov.in',
  ];
  if (trusted.some((t) => domain.includes(t))) return Math.max(baseScore, 80);
  if (domain.endsWith('.gov') || domain.endsWith('.edu')) return Math.max(baseScore, 75);
  if (domain.endsWith('.org')) return Math.max(baseScore - 10, 55);
  return Math.max(baseScore - 25, 35);
}

function getBarColor(score: number): string {
  if (score >= 75) return 'from-emerald-500 to-emerald-400';
  if (score >= 55) return 'from-yellow-500 to-yellow-400';
  return 'from-red-500 to-red-400';
}

export default function SourceTrustChart({ sources, trustScore }: SourceTrustChartProps) {
  // Show at least 3 items
  const displaySources = sources.length > 0
    ? sources.slice(0, 6)
    : ['No specific sources cited'];

  return (
    <div className="space-y-3">
      {displaySources.map((source, i) => {
        const score = sources.length > 0
          ? getDomainScore(source, trustScore)
          : 35;
        const barColor = getBarColor(score);

        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300 font-mono text-xs truncate max-w-[200px]">
                {source}
              </span>
              <span
                className={`text-xs font-bold ${
                  score >= 75
                    ? 'text-emerald-400'
                    : score >= 55
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {score}/100
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Overall score */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 font-medium">Overall Source Trust</span>
          <span
            className={`font-bold ${
              trustScore >= 75
                ? 'text-emerald-400'
                : trustScore >= 50
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}
          >
            {trustScore.toFixed(0)}/100
          </span>
        </div>
        <div className="h-3 mt-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getBarColor(trustScore)} transition-all duration-1000`}
            style={{ width: `${trustScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
