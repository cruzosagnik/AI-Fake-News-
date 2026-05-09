import NewsCard, { type NewsArticle } from './NewsCard';
import { Newspaper } from 'lucide-react';

interface NewsGridProps {
  articles: NewsArticle[];
  error: string | null;
}

export default function NewsGrid({ articles, error }: NewsGridProps) {
  if (articles.length === 0 && !error) {
    return (
      <div className="py-24 text-center text-zinc-500 bg-white/5 rounded-2xl border border-white/10">
        <Newspaper className="mx-auto mb-4 h-16 w-16 opacity-40" />
        <h3 className="text-xl font-bold text-zinc-300 mb-2">No news found</h3>
        <p>Try adjusting your search or filter criteria to see more results.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, i) => (
        <NewsCard key={`${article.url}-${i}`} article={article} index={i} />
      ))}
    </div>
  );
}
