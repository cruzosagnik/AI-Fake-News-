import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { type NewsArticle } from '../components/NewsCard';
import NewsGrid from '../components/NewsGrid';
import Loader from '../components/Loader';
import NewsTabs from '../components/NewsTabs';
import BreakingNewsBanner from '../components/BreakingNewsBanner';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY || ''; // Require API key from .env

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [breakingNews, setBreakingNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [category, setCategory] = useState('Technology');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch breaking news (just top general headlines for the banner)
  useEffect(() => {
    if (!API_KEY) return;
    const fetchBreaking = async () => {
      try {
        const res = await axios.get(`https://newsapi.org/v2/top-headlines?country=in&apiKey=${API_KEY}&pageSize=5`);
        setBreakingNews(res.data.articles.filter((a: any) => a.title && a.title !== '[Removed]'));
      } catch (err) {
        console.error('Failed to fetch breaking news');
      }
    };
    fetchBreaking();
  }, []);

  const fetchNews = async (pageNum: number, isNewSearch: boolean = false) => {
    if (!API_KEY) {
      setError("Please add your NewsAPI key to the .env file as VITE_NEWS_API_KEY.");
      setLoading(false);
      return;
    }

    try {
      if (isNewSearch) {
        setLoading(true);
        setError(null);
      }

      let url = '';
      
      // Map Politics to general with a query or just use general (NewsAPI doesn't have politics category)
      const apiCategory = category === 'Politics' ? 'general' : category.toLowerCase();
      
      url = `https://newsapi.org/v2/top-headlines?apiKey=${API_KEY}&page=${pageNum}&pageSize=12&country=us&category=${apiCategory}`;

      const response = await axios.get(url);
      const newArticles = response.data.articles.filter((a: any) => a.title && a.title !== '[Removed]');

      if (isNewSearch) {
        setArticles(newArticles);
      } else {
        setArticles(prev => {
          // avoid duplicates
          const existingUrls = new Set(prev.map(p => p.url));
          const uniqueNew = newArticles.filter((a: NewsArticle) => !existingUrls.has(a.url));
          return [...prev, ...uniqueNew];
        });
      }

      setHasMore(newArticles.length > 0);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      fetchNews(1, true);
    }, 100); 
    return () => clearTimeout(timeoutId);
  }, [category]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage, false);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black tracking-tight text-white sm:text-5xl"
          >
            Live <span className="text-orange-500">News</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-zinc-400 max-w-2xl mx-auto"
          >
            Stay updated with the latest headlines. Filter by category, country, or search for specific topics in real-time.
          </motion.p>
        </div>

        {/* Breaking News Banner */}
        <BreakingNewsBanner articles={breakingNews} />

        {/* Controls */}
        <div className="mb-10 flex justify-center">
          <NewsTabs 
            category={category} 
            setCategory={(c) => { setCategory(c); }} 
          />
        </div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/10 p-4"
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid / Loader */}
        {loading && page === 1 ? (
          <Loader />
        ) : (
          <>
            <NewsGrid articles={articles} error={error} />

            {/* Pagination / Load More */}
            {articles.length > 0 && hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Load More News'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
