import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Globe } from 'lucide-react';
import { getAnalytics, getCategories, getHistory, getTrend, getTrendingTopics } from '../lib/api';
import VerdictCard from '../components/VerdictCard';
import type { AnalysisResult, AnalyticsData } from '../types';
import { motion } from 'framer-motion';

const VERDICT_COLORS: Record<string, string> = {
  Real: '#34d399',
  Fake: '#f87171',
  Misleading: '#fb923c',
  'Partially True': '#fbbf24',
};



const CustomTooltip = ({ active, payload, label }: {active?:boolean; payload?: {name:string; value:number; color:string}[]; label?:string}) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-lg p-3 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([getAnalytics(), getCategories(), getHistory(), getTrend(), getTrendingTopics()])
        .then(([a, c, h, t, tp]) => {
          setAnalytics(a);
          setCategories(c);
          setHistory(h.analyses.slice(0, 10));
          setTrendData(t);
          setTrendingTopics(tp);
        })
        .catch(console.error);
    };

    fetchData(); // initial fetch
    const intervalId = setInterval(fetchData, 30000); // 30s poll

    return () => clearInterval(intervalId);
  }, []);

  const pieData = analytics
    ? [
        { name: 'Real', value: analytics.real },
        { name: 'Fake', value: analytics.fake },
        { name: 'Misleading', value: analytics.misleading },
        { name: 'Partially True', value: analytics.partiallyTrue },
      ]
    : [];

  const catData = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name: name.replace('_', ' '),
      count,
    }));

  return (
    <div className="min-h-screen bg-[#030303] text-white pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-white tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-gray-400 text-sm mt-1">Real-time insights and fact-checking metrics</p>
        </motion.div>

        {/* ── Stats Row ─────────────────────────── */}
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            { icon: Activity, label: 'Total Analyses', value: analytics?.total?.toLocaleString() ?? '—', color: 'text-orange-400' },
            { icon: AlertTriangle, label: 'Fake Detected', value: analytics?.fake?.toLocaleString() ?? '—', color: 'text-red-400' },
            { icon: CheckCircle, label: 'Accuracy Rate', value: analytics ? `${analytics.accuracyRate}%` : '—', color: 'text-emerald-400' },
            { icon: Globe, label: 'Languages', value: analytics?.languagesCount?.toString() ?? '—', color: 'text-amber-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <motion.div 
              key={label} 
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="glass-card p-5 border border-white/5 shadow-xl shadow-black/20"
            >
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <div className={`text-3xl font-black ${color} tracking-tight`}>{value}</div>
              <div className="text-gray-400 text-xs mt-1 font-medium">{label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Charts Row ────────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Pie Chart */}
          <div className="glass-card p-6 border border-white/5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Verdict Distribution</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={VERDICT_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Loading...</div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="glass-card p-6 lg:col-span-2 border border-white/5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Analyses by Category</h2>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Loading...</div>
            )}
          </div>
        </motion.div>

        {/* ── Line Chart + Trending ──────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* 7-day trend */}
          <div className="glass-card p-6 lg:col-span-2 border border-white/5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              7-Day Detection Trend
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-gray-400 text-xs">{v}</span>} />
                <Line type="monotone" dataKey="Real" stroke="#34d399" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Fake" stroke="#f87171" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Misleading" stroke="#fb923c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Trending Topics */}
          <div className="glass-card p-6 border border-white/5 shadow-xl shadow-black/20">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
              Trending Misinformation
            </h2>
            <div className="space-y-3">
              {trendingTopics.map((topic, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-gray-600 text-xs font-bold w-4">#{i + 1}</span>
                  <span className="text-gray-300 text-sm flex-1 truncate" title={topic}>{topic}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    Viral
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Recent Analyses Table ─────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-6 border border-white/5 shadow-xl shadow-black/20"
        >
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
            Recent Analyses
          </h2>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Content', 'Category', 'Verdict', 'Score', 'Date'].map((h) => (
                      <th key={h} className="text-left text-gray-500 text-xs uppercase pb-3 pr-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-3 pr-4 text-gray-300 max-w-xs truncate">{a.content}</td>
                      <td className="py-3 pr-4">
                        <span className="text-gray-400 text-xs capitalize">{a.category}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <VerdictCard verdict={a.verdict} size="sm" />
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{a.authenticityScore.toFixed(0)}</td>
                      <td className="py-3 text-gray-500 text-xs">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              No analyses yet. Start fact-checking on the home page.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
