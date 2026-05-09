interface VerdictCardProps {
  verdict: 'Real' | 'Fake' | 'Misleading' | 'Partially True';
  size?: 'sm' | 'lg';
}

const VERDICT_CONFIG = {
  Real: {
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    icon: '✓',
    pulse: 'bg-emerald-400',
  },
  Fake: {
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
    icon: '✕',
    pulse: 'bg-red-400',
  },
  Misleading: {
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20',
    icon: '⚠',
    pulse: 'bg-orange-400',
  },
  'Partially True': {
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/20',
    icon: '◐',
    pulse: 'bg-yellow-400',
  },
};

export default function VerdictCard({ verdict, size = 'lg' }: VerdictCardProps) {
  const config = VERDICT_CONFIG[verdict];

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.border} ${config.text}`}
      >
        <span>{config.icon}</span>
        {verdict}
      </span>
    );
  }

  return (
    <div
      className={`relative inline-flex flex-col items-center gap-2 px-8 py-5 rounded-2xl border-2 ${config.bg} ${config.border} shadow-2xl ${config.glow}`}
    >
      {/* Pulse ring */}
      <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: 'transparent', border: '2px solid currentColor' }} />

      <div className={`text-4xl font-black tracking-tight ${config.text}`}>{config.icon}</div>
      <div className={`text-2xl font-black tracking-wide ${config.text}`}>{verdict}</div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full animate-pulse ${config.pulse}`} />
        <span className="text-gray-400 text-xs font-medium">AI Verdict</span>
      </div>
    </div>
  );
}
