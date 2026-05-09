import { motion } from 'framer-motion';
import { ExternalLink, Calendar, Newspaper } from 'lucide-react';

export interface NewsArticle {
  title: string;
  urlToImage: string | null;
  source: { name: string };
  publishedAt: string;
  description: string | null;
  url: string;
}

interface NewsCardProps {
  article: NewsArticle;
  index: number;
}

export default function NewsCard({ article, index }: NewsCardProps) {
  const date = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isRecent = new Date().getTime() - new Date(article.publishedAt).getTime() < 12 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index % 12) * 0.05 }}
      whileHover={{ y: -5 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 p-5 backdrop-blur-md transition-all hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {isRecent && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          Live
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-grow">
        {article.urlToImage ? (
          <div className="mb-4 h-48 w-full overflow-hidden rounded-xl">
            <img 
              src={article.urlToImage} 
              alt={article.title} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                // fallback if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="mb-4 flex h-48 w-full items-center justify-center rounded-xl bg-white/5">
            <Newspaper className="h-12 w-12 text-zinc-700" />
          </div>
        )}

        <div className="mb-3 flex items-center justify-between text-xs font-medium text-zinc-500">
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-orange-200/70 border border-white/5">
            {article.source.name}
          </span>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{date}</span>
          </div>
        </div>

        <h3 className="mb-2 text-lg font-bold leading-snug text-zinc-100 line-clamp-2 group-hover:text-orange-400 transition-colors">
          {article.title}
        </h3>

        <p className="mb-6 text-sm leading-relaxed text-zinc-400 line-clamp-3">
          {article.description || 'No description available for this article.'}
        </p>
      </div>

      <div className="relative z-10 mt-auto pt-4 border-t border-white/5">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500 hover:text-black"
        >
          Read More
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </motion.div>
  );
}
