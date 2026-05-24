import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Shield, ArrowUpRight, Swords } from 'lucide-react';

// ── Link Columns ──────────────────────────────────────────────────────────────

const API_DOCS_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/docs`;

const COLUMNS: Record<string, { label: string; href: string; external?: boolean }[]> = {
  Platform: [
    { label: 'Analyze', href: '/analyze' },
    { label: 'AgentDebate', href: '/debate' },
    { label: 'Live News', href: '/news' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Resources: [
    { label: 'API Docs', href: API_DOCS_URL, external: true },
    { label: 'Pipeline Overview', href: '/#pipeline' },
    { label: 'How It Works', href: '/#pipeline' },
    { label: 'GitHub', href: 'https://github.com/', external: true },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Licenses', href: '#' },
  ],
};

// ── Footer Link ───────────────────────────────────────────────────────────────

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const cls =
    'group relative flex w-fit items-center gap-1 text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-100';

  const underline = (
    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-orange-400/60 transition-all duration-300 group-hover:w-full" />
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {label}
        <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
        {underline}
      </a>
    );
  }

  return (
    <Link to={href} className={cls}>
      {label}
      {underline}
    </Link>
  );
}

// ── Main Footer ───────────────────────────────────────────────────────────────

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const isInView = useInView(ref, { once: true, margin: '-80px' });

  // Parallax for the giant background text
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const bgTextY = useTransform(scrollYProgress, [0, 1], ['8%', '-4%']);

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <footer
      ref={ref}
      className="relative overflow-hidden border-t border-white/5 bg-[#030303]"
    >
      {/* ── Grain texture overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '180px 180px',
        }}
      />

      {/* ── Bottom ambient glow (orange) ── */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-0"
        style={{
          width: '900px',
          height: '320px',
          background:
            'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(249,115,22,0.13) 0%, rgba(249,115,22,0.04) 50%, transparent 80%)',
        }}
      />

      {/* ── Left edge glow (emerald — subtle nod to AgentDebate) ── */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-0"
        style={{
          width: '400px',
          height: '260px',
          background:
            'radial-gradient(ellipse 60% 70% at 0% 100%, rgba(52,211,153,0.05) 0%, transparent 70%)',
        }}
      />

      {/* ── Right edge glow (red — subtle nod to AgentDebate) ── */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 z-0"
        style={{
          width: '400px',
          height: '260px',
          background:
            'radial-gradient(ellipse 60% 70% at 100% 100%, rgba(248,113,113,0.04) 0%, transparent 70%)',
        }}
      />

      {/* ── Giant background "VerifyX" text ── */}
      <motion.div
        ref={textRef}
        style={{ y: bgTextY }}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex items-end justify-center overflow-hidden"
      >
        <span
          className="select-none font-serif font-bold leading-none tracking-tighter"
          style={{
            fontSize: 'clamp(8rem, 22vw, 22rem)',
            background: 'linear-gradient(180deg, rgba(251,146,60,0.45) 0%, rgba(251,146,60,0.22) 50%, rgba(251,146,60,0.06) 85%, transparent 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            maskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.7) 30%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.7) 30%, black 100%)',
            letterSpacing: '-0.04em',
            marginBottom: '-0.12em',
          }}
        >
          VerifyX
        </span>
      </motion.div>

      {/* ── Top hairline with orange center glow ── */}
      <div className="relative z-10 h-px w-full overflow-hidden">
        <div className="absolute inset-0 bg-white/5" />
        <div
          className="absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(249,115,22,0.5) 50%, transparent)',
          }}
        />
      </div>

      {/* ── Main content ── */}
      <motion.div
        initial="hidden"
        animate={isInView ? 'show' : 'hidden'}
        transition={{ staggerChildren: 0.08 }}
        className="relative z-10 mx-auto max-w-6xl px-6 py-20"
      >
        <div className="flex flex-col gap-16 lg:flex-row lg:gap-24">
          {/* ── Left: Brand ── */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-6 lg:max-w-xs"
          >
            {/* Logo */}
            <Link to="/" className="group flex w-fit items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-200/15 bg-gradient-to-br from-orange-300 to-orange-600 shadow-lg shadow-orange-500/20 transition-shadow group-hover:shadow-orange-500/35">
                <Shield className="h-4.5 w-4.5 text-black" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Verify<span className="text-orange-300">X</span>
                <span className="ml-1 text-xs font-normal text-zinc-600">AI</span>
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-sm leading-7 text-zinc-500">
              Detecting misinformation through{' '}
              <span className="font-medium text-zinc-300">explainable AI</span>.
              <br />
              6-agent pipeline + adversarial debate mode.
            </p>

            {/* AgentDebate badge */}
            <Link
              to="/debate"
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/8 bg-white/3 px-3.5 py-1.5 text-xs font-medium text-zinc-500 backdrop-blur-sm transition-all hover:border-orange-500/20 hover:bg-orange-500/5 hover:text-orange-300"
            >
              <Swords className="h-3 w-3 transition-colors group-hover:text-orange-400" />
              Try AgentDebate Mode
              <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />
            </Link>

            {/* Stack pills */}
            <div className="flex flex-wrap gap-2">
              {['Groq', 'FastAPI', 'React', 'MongoDB'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/5 bg-white/3 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ── Right: Link columns ── */}
          <div className="flex flex-1 flex-wrap gap-10 sm:gap-16 lg:justify-end">
            {Object.entries(COLUMNS).map(([title, links], colIdx) => (
              <motion.div
                key={title}
                variants={fadeUp}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                  delay: colIdx * 0.06,
                }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {title}
                </h3>
                <ul className="flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <FooterLink {...link} />
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 h-px w-full bg-white/5"
        />

        {/* ── Bottom bar ── */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        >
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} VerifyX. Built for AI hackathons.
          </p>

          <p className="text-xs text-zinc-700">
            Powered by{' '}
            <span className="text-zinc-600">Groq Llama 3.3 70B</span>
            {' · '}
            <span className="text-zinc-600">HuggingFace</span>
            {' · '}
            <span className="text-zinc-600">FastAPI</span>
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
