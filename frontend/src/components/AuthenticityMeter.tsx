import { useEffect, useState } from 'react';

interface AuthenticityMeterProps {
  score: number; // 0–100
}

function getColor(score: number): string {
  if (score >= 75) return '#34d399'; // emerald
  if (score >= 50) return '#fbbf24'; // yellow
  if (score >= 25) return '#fb923c'; // orange
  return '#f87171'; // red
}

function getLabel(score: number): string {
  if (score >= 75) return 'High Authenticity';
  if (score >= 50) return 'Partially Authentic';
  if (score >= 25) return 'Low Authenticity';
  return 'Very Low Authenticity';
}

export default function AuthenticityMeter({ score }: AuthenticityMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedScore((prev) => {
          if (prev >= score) {
            clearInterval(interval);
            return score;
          }
          return prev + 2;
        });
      }, 20);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const color = getColor(animatedScore);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          {/* Background track */}
          <circle
            stroke="rgba(255,255,255,0.05)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress arc */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.05s ease, stroke 0.3s ease',
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-black tabular-nums"
            style={{ color }}
          >
            {animatedScore}
          </span>
          <span className="text-gray-500 text-xs font-medium">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-center text-sm font-semibold" style={{ color }}>
          {getLabel(animatedScore)}
        </p>
        <p className="text-center text-xs text-gray-500 mt-0.5">Authenticity Score</p>
      </div>
    </div>
  );
}
