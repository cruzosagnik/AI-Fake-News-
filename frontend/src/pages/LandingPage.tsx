import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  Circle,
  CloudLightning,
  Cpu,
  Film,
  Globe2,
  HeartPulse,
  Landmark,
  MapPin,
  MessageCircle,
  Shield,
  Sparkles,
  TriangleAlert,
  Trophy,
  X,
} from 'lucide-react';
import InputPanel from '../components/InputPanel';
import FeatureGrid from '../components/FeatureGrid';
import LogoLoop from '../components/ui/LogoLoop';

import { useAnalysis } from '../hooks/useAnalysis';

const CATEGORIES = [
  { node: <CategoryLoopItem icon={<Landmark />} label="Politics" />, title: 'Politics' },
  { node: <CategoryLoopItem icon={<HeartPulse />} label="Health" />, title: 'Health' },
  { node: <CategoryLoopItem icon={<ChartNoAxesCombined />} label="Finance" />, title: 'Finance' },
  { node: <CategoryLoopItem icon={<Trophy />} label="Sports" />, title: 'Sports' },
  { node: <CategoryLoopItem icon={<Cpu />} label="Technology" />, title: 'Technology' },
  { node: <CategoryLoopItem icon={<Film />} label="Entertainment" />, title: 'Entertainment' },
  { node: <CategoryLoopItem icon={<CloudLightning />} label="Disasters" />, title: 'Disasters' },
  { node: <CategoryLoopItem icon={<MessageCircle />} label="Social Media" />, title: 'Social Media' },
  { node: <CategoryLoopItem icon={<MapPin />} label="National" />, title: 'National' },
  { node: <CategoryLoopItem icon={<Globe2 />} label="International" />, title: 'International' },
];

const STATS = [
  { label: 'Articles Analyzed', value: '1M+' },
  { label: 'Accuracy Rate', value: '94%' },
  { label: 'Languages', value: '3' },
  { label: 'AI Agents', value: '6' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { result, loading, error, steps, analyze } = useAnalysis();

  useEffect(() => {
    if (result) {
      navigate('/analyze', { state: { result, steps } });
    }
  }, [result, navigate, steps]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#030303] text-white">
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-135 w-225 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.28),rgba(255,122,26,0.08)_36%,transparent_68%)] blur-3xl" />
          <div className="absolute left-1/2 top-24 h-px w-[80vw] -translate-x-1/2 bg-linear-to-r from-transparent via-orange-200/30 to-transparent" />
          <div className="absolute bottom-0 left-0 h-105 w-105 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-90 w-90 rounded-full bg-zinc-100/8 blur-3xl" />
          <div className="luxury-grid absolute inset-0 opacity-[0.18]" />
        </div>

        <motion.div
          className="relative z-10 mx-auto max-w-5xl text-center"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.12 }}
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-zinc-300 shadow-2xl shadow-orange-950/30 backdrop-blur-2xl"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-300" />
            Latest component
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-5xl font-serif text-[clamp(3.25rem,9vw,8.5rem)] leading-[0.92] tracking-normal text-white"
          >
            Uncover the truth with{' '}
            <span className="italic text-transparent bg-clip-text bg-linear-to-r from-orange-200 via-orange-400 to-orange-600">
              precision
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-8 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg"
          >
            TruthLens AI empowers you to detect misinformation across{' '}
            <span className="font-semibold text-zinc-100">10+ categories</span> in{' '}
            <span className="font-semibold text-zinc-100">3 languages</span>. Our modular 6-agent pipeline delivers an exhaustive, transparent fact-checking report instantly.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <a
              href="#analyze"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_70px_rgba(249,115,22,0.35)] transition duration-300 hover:bg-orange-400"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#pipeline"
              aria-label="View pipeline"
              className="group inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-950/70 text-zinc-200 shadow-2xl shadow-black/60 backdrop-blur-xl transition duration-300 hover:border-orange-300/40 hover:text-orange-200"
            >
              <ArrowDownRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-10 w-full max-w-3xl"
          >
            <div className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-zinc-600">
              Analyzing across live domains
            </div>
            <LogoLoop
              logos={CATEGORIES}
              speed={64}
              direction="left"
              logoHeight={34}
              gap={14}
              hoverSpeed={12}
              scaleOnHover
              fadeOut
              fadeOutColor="#030303"
              ariaLabel="TruthLens analysis categories"
            />
          </motion.div>
        </motion.div>

        <div className="pointer-events-none absolute bottom-88 left-[8%] hidden text-orange-200/50 lg:block">
          <div className="hand-arrow hand-arrow-left">⌁</div>
        </div>
        <div className="pointer-events-none absolute bottom-80 right-[10%] hidden text-orange-200/45 lg:block">
          <div className="hand-arrow hand-arrow-right">⌁</div>
        </div>

        <motion.div
          id="analyze"
          className="relative z-10 mx-auto mt-14 w-full max-w-3xl px-0 sm:px-4"
          initial={{ opacity: 0, y: 38, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <InputPanel onAnalyze={analyze} loading={loading} />
          {error && (
            <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-300">
              {error}
            </div>
          )}
        </motion.div>

        <motion.div
          className="relative z-10 mt-12"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowRight className="h-5 w-5 rotate-90 text-zinc-700" />
        </motion.div>
      </section>

      <section className="border-y border-white/10 bg-white/2.5 px-4 py-8 backdrop-blur-xl">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="font-serif text-3xl text-transparent bg-clip-text bg-linear-to-r from-orange-200 to-orange-500">
                {value}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <FeatureGrid />

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center font-serif text-3xl text-white">
            Four Verdict Categories
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { verdict: 'Real', color: 'from-emerald-600/15 to-white/2', border: 'border-emerald-500/15', text: 'text-emerald-300', Icon: Check },
              { verdict: 'Fake', color: 'from-red-600/15 to-white/2', border: 'border-red-500/15', text: 'text-red-300', Icon: X },
              { verdict: 'Misleading', color: 'from-orange-600/20 to-white/2', border: 'border-orange-500/20', text: 'text-orange-300', Icon: TriangleAlert },
              { verdict: 'Partially True', color: 'from-yellow-600/15 to-white/2', border: 'border-yellow-500/15', text: 'text-yellow-300', Icon: Circle },
            ].map(({ verdict, color, border, text, Icon }) => (
              <div
                key={verdict}
                className={`flex flex-col items-center gap-3 rounded-2xl border bg-linear-to-b ${color} ${border} p-6 shadow-2xl shadow-black/30 backdrop-blur-xl`}
              >
                <Icon className={`h-7 w-7 ${text}`} />
                <span className={`text-sm font-bold ${text}`}>{verdict}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-zinc-600">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Shield className="h-4 w-4 text-orange-400" />
          <span className="font-bold text-zinc-400">TruthLens AI</span>
        </div>
        <p>Built for Hackathons · React + FastAPI + MongoDB + Gemini + HuggingFace</p>
      </footer>
    </div>
  );
}

function CategoryLoopItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex h-8.5 items-center gap-2 rounded-full border border-white/10 bg-white/3.5 px-4 text-[13px] font-semibold text-zinc-400 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors hover:border-orange-300/30 hover:bg-orange-400/10 hover:text-orange-100">
      <span className="flex h-5 w-5 items-center justify-center text-orange-300 [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
      </span>
      {label}
    </span>
  );
}
