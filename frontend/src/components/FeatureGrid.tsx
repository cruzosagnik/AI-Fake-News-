import React from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { 
  FileSearch, 
  Layers, 
  ShieldCheck, 
  Scale, 
  Network, 
  Gavel 
} from 'lucide-react';

const FEATURES = [
  { agent: 'A', label: 'Step 1', title: 'Claim Extraction', description: 'AI identifies 3-7 verifiable factual claims', className: 'md:col-span-1 md:row-span-1', color: 'from-orange-500 to-amber-300', Icon: FileSearch },
  { agent: 'B', label: 'Step 2', title: 'Category Detection', description: 'Classifies into one of 10 news domains', className: 'md:col-span-2 md:row-span-1', color: 'from-zinc-100 to-zinc-500', Icon: Layers },
  { agent: 'C', label: 'Step 3', title: 'Source Verification', description: 'Cross-checks against 50+ trusted domains', className: 'md:col-span-2 md:row-span-2', color: 'from-orange-400 to-red-400', Icon: ShieldCheck },
  { agent: 'D', label: 'Step 4', title: 'Bias Analysis', description: 'Detects propaganda and emotional manipulation', className: 'md:col-span-1 md:row-span-1', color: 'from-amber-500 to-orange-300', Icon: Scale },
  { agent: 'E', label: 'Step 5', title: 'Semantic Matching', description: 'Measures consistency using NLP embeddings', className: 'md:col-span-1 md:row-span-1', color: 'from-zinc-200 to-stone-500', Icon: Network },
  { agent: 'F', label: 'Step 6', title: 'Verdict Generation', description: 'Weighted score -> Real / Fake / Misleading', className: 'md:col-span-1 md:row-span-1', color: 'from-orange-500 to-yellow-200', Icon: Gavel },
];

function InteractiveCard({ feature, index }: { feature: typeof FEATURES[0], index: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 0.98 }}
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-md transition-all hover:border-orange-500/50 hover:shadow-[0_0_40px_rgba(249,115,22,0.15)] ${feature.className}`}
    >
      {/* Interactive Cursor Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(249, 115, 22, 0.15),
              transparent 80%
            )
          `
        }}
      />

      {/* Internal Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {/* Decorative Background Icon */}
      <div className="absolute -bottom-8 -right-8 opacity-5 transition-all duration-700 group-hover:-translate-x-4 group-hover:-translate-y-4 group-hover:opacity-15 group-hover:scale-110 group-hover:rotate-12 pointer-events-none">
        <feature.Icon className="h-48 w-48 text-orange-500" strokeWidth={1} />
      </div>

      {/* Decorative Subtle Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10">
        <div className="mb-4 inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-2 pr-4 backdrop-blur-md">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br ${feature.color} text-xs font-black text-black shadow-lg`}>
            {feature.agent}
          </div>
          <span className="text-xs font-semibold tracking-wide text-orange-200/70 uppercase">{feature.label}</span>
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <h3 className="mb-2 text-2xl font-bold tracking-tight text-white group-hover:text-orange-100 transition-colors">
          {feature.title}
        </h3>
        <p className="text-sm font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function FeatureGrid() {
  return (
    <section className="px-4 py-24 relative overflow-hidden bg-[#030303]">
      {/* Background Radial Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-6xl relative z-10">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 font-serif text-4xl text-white sm:text-5xl tracking-tight"
          >
            How the <span className="text-orange-500">AI Pipeline</span> Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-xl text-zinc-400"
          >
            Six specialized agents collaborate to produce a transparent, multi-dimensional fact-check report.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[220px] gap-4 sm:gap-6">
          {FEATURES.map((feature, i) => (
            <InteractiveCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
