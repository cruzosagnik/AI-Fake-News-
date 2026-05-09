import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ScoreRadarProps {
  authenticityScore: number;
  confidenceScore: number;
  biasScore: number;
  clickbaitScore: number;
}

export default function ScoreRadar({
  authenticityScore,
  confidenceScore,
  biasScore,
  clickbaitScore,
}: ScoreRadarProps) {
  const data = [
    { subject: 'Authenticity', score: authenticityScore, fullMark: 100 },
    { subject: 'Confidence', score: confidenceScore, fullMark: 100 },
    { subject: 'Source Trust', score: Math.max(0, 100 - biasScore), fullMark: 100 },
    { subject: 'Neutrality', score: Math.max(0, 100 - biasScore), fullMark: 100 },
    { subject: 'Credibility', score: Math.max(0, 100 - clickbaitScore), fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px',
          }}
          formatter={(value) => [
            typeof value === 'number' ? value.toFixed(1) : value,
            'Score',
          ]}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#f97316"
          fill="#f97316"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
