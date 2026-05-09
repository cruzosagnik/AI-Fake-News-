const CATEGORIES = ['General', 'Politics', 'Technology', 'Business', 'Sports', 'Health', 'Science', 'Entertainment'];

interface NewsTabsProps {
  category: string;
  setCategory: (c: string) => void;
}

export default function NewsTabs({ category, setCategory }: NewsTabsProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Category Badges */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              category === cat
                ? 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                : 'border-white/10 bg-transparent text-zinc-400 hover:border-white/20 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
