import { useState } from 'react';
import React from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';
import {
  Swords, ChevronDown, ChevronUp, Loader2, AlertTriangle,
  Shield, Skull, Scale, Zap, Clock, Sparkles, ArrowRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Footer from '../components/Footer';

// ── Types ────────────────────────────────────────────────────────────────────

interface AgentArgument {
  stance?: string;
  confidence?: number;
  arguments?: string[];
  supporting_evidence?: string[];
  credibility_signals?: string[];
  red_flags?: string[];
  manipulation_techniques?: string[];
  weaknesses_acknowledged?: string;
}

interface GammaVerdict {
  alpha_score?: number;
  beta_score?: number;
  stronger_side?: string;
  verdict?: string;
  authenticity_score?: number;
  confidence?: number;
  reasoning?: string;
  key_deciding_factor?: string;
  dissenting_note?: string;
}

interface TranscriptTurn {
  turn: number;
  agent: 'Alpha' | 'Beta' | 'Gamma';
  role: string;
  content: AgentArgument | GammaVerdict;
}

interface DebateResult {
  mode: string;
  rounds_conducted: number;
  alpha_argument: AgentArgument;
  beta_argument: AgentArgument;
  alpha_rebuttal: AgentArgument;
  beta_rebuttal: AgentArgument;
  gamma_verdict: GammaVerdict;
  final_verdict: string;
  authenticity_score: number;
  debate_transcript: TranscriptTurn[];
  processing_time_ms: number;
  incomplete_debate?: boolean;
  error?: string;
}

// ── Design Tokens ─────────────────────────────────────────────────────────────

const ALPHA = { color: '#34d399', bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.18)' };
const BETA  = { color: '#f87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.18)' };

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Real:             { bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.3)'  },
  'Partially True': { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.3)'  },
  Misleading:       { bg: 'rgba(251,146,60,0.1)',  text: '#fb923c', border: 'rgba(251,146,60,0.3)'  },
  Fake:             { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.3)' },
  Unknown:          { bg: 'rgba(113,113,122,0.1)', text: '#71717a', border: 'rgba(113,113,122,0.3)' },
};

function verdictStyle(v: string) {
  return VERDICT_STYLES[v] ?? VERDICT_STYLES['Unknown'];
}

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

// ── Animated Score Ring ───────────────────────────────────────────────────────

function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  const radius = 38;
  const sw = 7;
  const norm = radius - sw / 2;
  const circ = norm * 2 * Math.PI;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} className="-rotate-90">
          <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth={sw} r={norm} cx={radius} cy={radius} />
          <motion.circle
            stroke={color} fill="transparent" strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
            r={norm} cx={radius} cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black tabular-nums" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-500 font-medium text-center">{label}</span>
    </div>
  );
}

// ── Animated Score Bar ────────────────────────────────────────────────────────

function ScoreBar({ value, color, label, suffix = '' }: { value: number; color: string; label: string; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span style={{ color }} className="font-bold tabular-nums">{value}{suffix}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}55` }}
        />
      </div>
    </div>
  );
}

// ── Argument List ─────────────────────────────────────────────────────────────

function ArgList({ items, color }: { items?: string[]; color: string }) {
  if (!items?.length) return <p className="text-zinc-600 text-xs italic">No data available</p>;
  return (
    <ul className="space-y-2">
      {items.map((arg, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
          className="flex gap-2.5 text-sm text-zinc-300 leading-snug"
        >
          <span style={{ color }} className="mt-1 shrink-0 text-xs">▸</span>
          {arg}
        </motion.li>
      ))}
    </ul>
  );
}

// ── Interactive Agent Card ─────────────────────────────────────────────────────

function AgentCard({
  title, agentLetter, icon, stanceLabel, stanceVerb,
  color, bg, border,
  argument, rebuttal,
}: {
  title: string;
  agentLetter: string;
  icon: React.ReactNode;
  stanceLabel: string;
  stanceVerb: string;
  color: string;
  bg: string;
  border: string;
  argument: AgentArgument;
  rebuttal: AgentArgument;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const extraItems =
    color === ALPHA.color
      ? [...(argument.supporting_evidence ?? []), ...(argument.credibility_signals ?? [])]
      : [...(argument.red_flags ?? []), ...(argument.manipulation_techniques ?? [])];
  const extraLabel = color === ALPHA.color ? 'Supporting Evidence' : 'Red Flags & Techniques';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, scale: 0.99 }}
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col overflow-hidden rounded-3xl border p-7 backdrop-blur-md transition-all"
      style={{ background: bg, borderColor: border }}
    >
      {/* Cursor spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-0"
        style={{
          background: useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, ${color}18, transparent 70%)`,
        }}
      />
      {/* Decorative bg icon */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 opacity-[0.04] transition-all duration-700 group-hover:opacity-[0.09] group-hover:scale-110 group-hover:rotate-6">
        <span style={{ color, fontSize: '10rem', lineHeight: 1 }}>{agentLetter}</span>
      </div>

      <div className="relative z-10 space-y-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-3 py-2 pr-4 backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl text-black font-black text-sm shadow-lg" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
              {icon}
            </div>
            <span className="text-xs font-bold tracking-wide uppercase" style={{ color }}>{title}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: color + '18', color }}>
              {stanceLabel}
            </span>
            {argument.confidence !== undefined && (
              <span className="text-xs text-zinc-500">{argument.confidence}% confident</span>
            )}
          </div>
        </div>

        {/* Confidence bar */}
        {argument.confidence !== undefined && (
          <ScoreBar value={argument.confidence} color={color} label="Confidence" suffix="%" />
        )}

        {/* Opening */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color }}>
            {stanceVerb} — Opening
          </p>
          <ArgList items={argument.arguments} color={color} />
        </div>

        {/* Extra signals */}
        {extraItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-zinc-600">{extraLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {extraItems.slice(0, 3).map((item, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs border" style={{ borderColor: color + '30', color: color + 'cc', background: color + '0a' }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rebuttal */}
        {rebuttal?.arguments?.length ? (
          <div className="border-t pt-4" style={{ borderColor: color + '20' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color }}>
              Rebuttal
            </p>
            <ArgList items={rebuttal.arguments} color={color} />
          </div>
        ) : null}

        {/* Weakness */}
        {argument.weaknesses_acknowledged && (
          <div className="mt-auto rounded-2xl p-3 border border-white/5 bg-white/3">
            <p className="text-xs text-zinc-500 font-medium mb-0.5">Acknowledged weakness</p>
            <p className="text-xs text-zinc-400 italic leading-relaxed">{argument.weaknesses_acknowledged}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Transcript Accordion ──────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  opening: 'Opening Argument',
  rebuttal: 'Rebuttal',
  round2_rebuttal: 'Round 2 Rebuttal',
  verdict: 'Final Verdict',
};

function TranscriptAccordion({ transcript }: { transcript: TranscriptTurn[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="rounded-3xl border border-white/5 bg-white/3 overflow-hidden backdrop-blur-md">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-zinc-300 hover:text-white transition-colors hover:bg-white/3"
      >
        <span className="flex items-center gap-2">
          <span className="text-orange-400">📜</span>
          Full Debate Transcript
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-zinc-500">{transcript.length} turns</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-white/5 border-t border-white/5">
              {transcript.map((turn) => {
                const agentColor = turn.agent === 'Alpha' ? ALPHA.color : turn.agent === 'Beta' ? BETA.color : '#fb923c';
                const isEx = expanded === turn.turn;
                return (
                  <div key={turn.turn}>
                    <button
                      onClick={() => setExpanded(isEx ? null : turn.turn)}
                      className="w-full flex items-center justify-between px-6 py-3 text-sm hover:bg-white/3 transition-colors text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-600 text-xs w-12">Turn {turn.turn}</span>
                        <span style={{ color: agentColor }} className="font-semibold text-sm">
                          {turn.agent === 'Alpha' ? '🟢 Alpha' : turn.agent === 'Beta' ? '🔴 Beta' : '⚖️ Gamma'}
                        </span>
                        <span className="text-zinc-600 text-xs">{ROLE_LABEL[turn.role] ?? turn.role}</span>
                      </span>
                      {isEx
                        ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
                        : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
                    </button>
                    <AnimatePresence>
                      {isEx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <pre className="px-6 pb-4 text-xs text-zinc-500 whitespace-pre-wrap font-mono leading-relaxed border-t border-white/5">
                            {JSON.stringify(turn.content, null, 2)}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function DebatePage() {
  const [text, setText] = useState('');
  const [rounds, setRounds] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebateResult | null>(null);

  const handleAnalyze = async () => {
    if (text.trim().length < 30) {
      toast.error('Please enter at least 30 characters.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/debate/debate-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), rounds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
      }
      const data: DebateResult = await res.json();
      setResult(data);
      if (data.incomplete_debate) {
        toast.error('Debate completed partially — some agents timed out.');
      } else {
        toast.success('Debate complete — Gamma has delivered the verdict!');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error(`Analysis failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const gamma = result?.gamma_verdict ?? {};
  const vs = verdictStyle(result?.final_verdict ?? 'Unknown');

  return (
    <div className="min-h-screen overflow-hidden bg-[#030303] text-white">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 pb-12 pt-32">
        {/* Background glows — orange to match app theme */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.18),rgba(255,122,26,0.05)_40%,transparent_70%)] blur-3xl" />
          <div className="absolute left-1/4 top-1/3 h-[300px] w-[300px] rounded-full blur-3xl" style={{ background: 'rgba(52,211,153,0.06)' }} />
          <div className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full blur-3xl" style={{ background: 'rgba(248,113,113,0.06)' }} />
          <div className="absolute left-1/2 top-24 h-px w-[80vw] -translate-x-1/2 bg-linear-to-r from-transparent via-orange-200/20 to-transparent" />
          <div className="luxury-grid absolute inset-0 opacity-[0.15]" />
        </div>

        <motion.div
          className="relative z-10 mx-auto max-w-4xl text-center"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.1 }}
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-zinc-300 shadow-2xl shadow-orange-950/30 backdrop-blur-2xl"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-300" />
            Adversarial Multi-Agent Verification
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl font-serif text-[clamp(2.8rem,8vw,7rem)] leading-[0.92] tracking-normal text-white"
          >
            Agent<span className="italic text-transparent bg-clip-text bg-linear-to-r from-orange-200 via-orange-400 to-orange-600">Debate</span>{' '}
            Analysis
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-xl text-base leading-8 text-zinc-400"
          >
            Two AIs argue, a third decides.{' '}
            <span className="font-semibold text-zinc-100">Adversarial AI</span> for{' '}
            adversarial information.
          </motion.p>

          {/* Alpha vs Beta vs Gamma chips */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex items-center justify-center gap-3 flex-wrap"
          >
            {[
              { label: 'Agent Alpha', desc: 'Defends REAL', color: ALPHA.color, icon: '🟢' },
              { label: 'vs', desc: '', color: '#52525b', icon: '' },
              { label: 'Agent Beta', desc: 'Prosecutes FAKE', color: BETA.color, icon: '🔴' },
              { label: 'vs', desc: '', color: '#52525b', icon: '' },
              { label: 'Agent Gamma', desc: 'Neutral Judge', color: '#fb923c', icon: '⚖️' },
            ].map((item, i) =>
              item.label === 'vs' ? (
                <span key={i} className="text-zinc-700 font-bold">⚔</span>
              ) : (
                <div
                  key={i}
                  className="inline-flex flex-col items-center gap-0.5 rounded-2xl border px-4 py-2 backdrop-blur-md"
                  style={{ borderColor: item.color + '30', background: item.color + '0a' }}
                >
                  <span className="text-xs font-bold" style={{ color: item.color }}>{item.icon} {item.label}</span>
                  <span className="text-[10px] text-zinc-500">{item.desc}</span>
                </div>
              )
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Input Panel ──────────────────────────────────── */}
      <section className="relative z-10 px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 38, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl"
        >
          <div className="glass-card p-6 border border-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.5)]">
            <textarea
              id="debate-input"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste the news content, article, or claim you want to analyze…"
              rows={6}
              className="w-full bg-transparent text-zinc-200 placeholder-zinc-600 text-sm resize-none outline-none leading-relaxed"
            />

            <div className="mt-4 flex items-center justify-between flex-wrap gap-3 border-t border-white/5 pt-4">
              {/* Rounds toggle */}
              <div className="flex items-center gap-1 rounded-2xl border border-white/8 p-1 bg-white/3">
                <button
                  id="rounds-1-btn"
                  onClick={() => setRounds(1)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    rounds === 1
                      ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Fast · 1 Round
                </button>
                <button
                  id="rounds-2-btn"
                  onClick={() => setRounds(2)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    rounds === 2
                      ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Scale className="w-3 h-3" />
                  Thorough · 2 Rounds
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-zinc-600 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{rounds === 1 ? '20' : '35'}s
                </span>
                <button
                  id="debate-analyze-btn"
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="group inline-flex min-h-10 items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-black shadow-[0_10px_40px_rgba(249,115,22,0.3)] transition duration-300 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Debating…</>
                  ) : (
                    <><Swords className="w-4 h-4" /> Start Debate <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" /></>
                  )}
                </button>
              </div>
            </div>

            <p className="mt-3 text-zinc-700 text-xs italic">
              Debate Mode runs 3 AI agents in adversarial debate for deeper analysis. ~10s longer than Standard Mode.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Loading ──────────────────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.section
            key="loader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 px-4 pb-10"
          >
            <div className="glass-card mx-auto max-w-3xl p-12 flex flex-col items-center gap-6 border border-white/5">
              <div className="flex items-center gap-8">
                {[
                  { color: ALPHA.color, label: 'Alpha', icon: <Shield className="w-6 h-6" /> },
                  { color: '#fb923c',   label: 'Debating', icon: <Swords className="w-6 h-6" /> },
                  { color: BETA.color,  label: 'Beta',  icon: <Skull className="w-6 h-6" /> },
                ].map((a, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.05, 0.95] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
                      style={{ color: a.color }}
                    >
                      {a.icon}
                    </motion.div>
                    <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-zinc-300 font-medium">Agents are debating your content…</p>
                <p className="text-xs text-zinc-600 mt-1">Gamma will review the full transcript and decide</p>
              </div>
              {/* Orange progress shimmer */}
              <div className="w-48 h-0.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full w-1/3 rounded-full bg-orange-500"
                  animate={{ x: ['-100%', '400%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Results ──────────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.section
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 px-4 pb-24"
          >
            <div className="mx-auto max-w-6xl space-y-6">
              {/* Incomplete warning */}
              {result.incomplete_debate && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Debate completed partially — some agents timed out. Results may be incomplete.
                </div>
              )}

              {/* Section label */}
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Debate Results</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* ── Alpha vs Beta ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <AgentCard
                  title="Agent Alpha"
                  agentLetter="α"
                  icon={<Shield className="w-4 h-4" />}
                  stanceLabel="REAL"
                  stanceVerb="Defending"
                  color={ALPHA.color}
                  bg={ALPHA.bg}
                  border={ALPHA.border}
                  argument={result.alpha_argument}
                  rebuttal={result.alpha_rebuttal}
                />
                <AgentCard
                  title="Agent Beta"
                  agentLetter="β"
                  icon={<Skull className="w-4 h-4" />}
                  stanceLabel="FAKE"
                  stanceVerb="Prosecuting"
                  color={BETA.color}
                  bg={BETA.bg}
                  border={BETA.border}
                  argument={result.beta_argument}
                  rebuttal={result.beta_rebuttal}
                />
              </div>

              {/* ── Gamma Judge Panel ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-md transition-all hover:border-orange-500/30 hover:shadow-[0_0_50px_rgba(249,115,22,0.08)]"
              >
                {/* Decorative bg */}
                <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-[0.03]">
                  <Scale strokeWidth={1} className="h-48 w-48 text-orange-400" />
                </div>

                <div className="relative z-10 space-y-6">
                  {/* Gamma header */}
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-5 border-b border-white/5">
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-3 py-2 pr-4 backdrop-blur-md">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-orange-600 text-black shadow-lg">
                        <Scale className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold tracking-wide uppercase text-orange-200/70">Agent Gamma — The Judge</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <span>{result.rounds_conducted} round{result.rounds_conducted > 1 ? 's' : ''} conducted</span>
                      <span>·</span>
                      <span>{result.processing_time_ms}ms</span>
                    </div>
                  </div>

                  {/* Score rings + bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                    <div className="flex justify-center sm:justify-start gap-6">
                      <ScoreRing score={gamma.alpha_score ?? 50} color={ALPHA.color} label={`Alpha${gamma.stronger_side === 'Alpha' ? ' ★' : ''}`} />
                      <ScoreRing score={gamma.beta_score ?? 50} color={BETA.color} label={`Beta${gamma.stronger_side === 'Beta' ? ' ★' : ''}`} />
                    </div>
                    <div className="sm:col-span-2 space-y-3">
                      <ScoreBar value={gamma.alpha_score ?? 50} color={ALPHA.color} label="Alpha argument quality" />
                      <ScoreBar value={gamma.beta_score ?? 50} color={BETA.color} label="Beta argument quality" />
                    </div>
                  </div>

                  {/* Key deciding factor */}
                  {gamma.key_deciding_factor && (
                    <div className="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-orange-300/70 mb-1.5">Key Deciding Factor</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">"{gamma.key_deciding_factor}"</p>
                    </div>
                  )}

                  {/* Reasoning + dissenting */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {gamma.reasoning && (
                      <div className="rounded-2xl border border-white/5 bg-white/3 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Reasoning</p>
                        <p className="text-sm text-zinc-400 leading-relaxed">{gamma.reasoning}</p>
                      </div>
                    )}
                    {gamma.dissenting_note && (
                      <div className="rounded-2xl border border-white/5 bg-white/3 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Dissenting Note</p>
                        <p className="text-sm text-zinc-500 leading-relaxed italic">"{gamma.dissenting_note}"</p>
                      </div>
                    )}
                  </div>

                  {/* Final Verdict Box */}
                  <div
                    className="rounded-2xl border-2 p-6 text-center relative overflow-hidden"
                    style={{ background: vs.bg, borderColor: vs.border }}
                  >
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${vs.text}, transparent 70%)` }} />
                    <p className="text-xs font-bold uppercase tracking-widest mb-2 relative z-10" style={{ color: vs.text }}>
                      ⚖ Final Verdict
                    </p>
                    <div className="text-4xl font-black tracking-tight mb-3 relative z-10 font-serif" style={{ color: vs.text }}>
                      {result.final_verdict}
                    </div>
                    <div className="flex items-center justify-center gap-6 text-sm relative z-10">
                      <div className="flex flex-col items-center">
                        <span className="text-zinc-500 text-xs">Authenticity</span>
                        <span className="font-black text-lg tabular-nums" style={{ color: vs.text }}>
                          {gamma.authenticity_score ?? result.authenticity_score}
                          <span className="text-xs font-normal text-zinc-500">/100</span>
                        </span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col items-center">
                        <span className="text-zinc-500 text-xs">Confidence</span>
                        <span className="font-black text-lg tabular-nums text-white">{gamma.confidence ?? 0}%</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col items-center">
                        <span className="text-zinc-500 text-xs">Stronger Side</span>
                        <span className="font-bold text-sm text-white">{gamma.stronger_side ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Transcript Accordion ── */}
              {result.debate_transcript.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <TranscriptAccordion transcript={result.debate_transcript} />
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Footer ─────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
