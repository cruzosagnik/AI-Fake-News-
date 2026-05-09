import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { type NewsArticle } from './NewsCard';
import { useState, useEffect } from 'react';

export default function BreakingNewsBanner({ articles }: { articles: NewsArticle[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (articles.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [articles]);

  if (articles.length === 0) return null;

  const article = articles[currentIndex];

  return (
    <div className="mb-8 relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/10 via-black to-black">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 font-bold text-red-500">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs uppercase tracking-wider">Breaking</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative h-6">
          <AnimatePresence mode="wait">
            <motion.a
              key={currentIndex}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 truncate text-sm font-medium text-zinc-200 hover:text-orange-400 hover:underline flex items-center"
            >
              <TrendingUp className="mr-2 h-4 w-4 inline text-orange-500 shrink-0" />
              {article.title}
            </motion.a>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
