import { AlertTriangle } from 'lucide-react';

interface ClaimsBreakdownProps {
  claims: string[];
  suspiciousClaims: string[];
}

export default function ClaimsBreakdown({ claims, suspiciousClaims }: ClaimsBreakdownProps) {
  const allClaims = [...new Set([...claims, ...suspiciousClaims])];

  if (allClaims.length === 0) {
    return (
      <p className="text-gray-500 text-sm italic">No specific claims were extracted.</p>
    );
  }

  return (
    <div className="space-y-2">
      {allClaims.map((claim, i) => {
        const isSuspicious = suspiciousClaims.some(
          (s) => s.toLowerCase().includes(claim.toLowerCase().slice(0, 30)) || claim === s
        );

        return (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-lg border text-sm transition-all ${
              isSuspicious
                ? 'bg-red-500/5 border-red-500/20 text-red-200'
                : 'bg-white/3 border-white/5 text-gray-300'
            }`}
          >
            {isSuspicious ? (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-center text-gray-600 text-xs font-bold">
                {i + 1}
              </span>
            )}
            <span className="leading-relaxed">{claim}</span>
            {isSuspicious && (
              <span className="flex-shrink-0 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                Suspicious
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
