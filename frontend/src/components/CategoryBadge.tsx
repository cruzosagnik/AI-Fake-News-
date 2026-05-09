const CATEGORY_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  politics: { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', emoji: '🗳️' },
  health: { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', emoji: '🏥' },
  finance: { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', emoji: '📈' },
  sports: { color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', emoji: '⚽' },
  tech: { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', emoji: '💻' },
  entertainment: { color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20', emoji: '🎬' },
  disasters: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', emoji: '🌪️' },
  social_media: { color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', emoji: '📱' },
  national: { color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20', emoji: '🇮🇳' },
  international: { color: 'text-teal-400', bg: 'bg-teal-400/10 border-teal-400/20', emoji: '🌍' },
};

interface CategoryBadgeProps {
  category: string;
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category.toLowerCase()] || {
    color: 'text-gray-400',
    bg: 'bg-gray-400/10 border-gray-400/20',
    emoji: '📰',
  };

  const label = category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.color}`}
    >
      <span>{config.emoji}</span>
      {label}
    </span>
  );
}
