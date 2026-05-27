import { useEffect, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ShieldAlert, Network, Terminal } from 'lucide-react';

const LOG_MESSAGES = [
  "[CORE] Initiating system diagnostics...",
  "[AGENT_ALPHA] Re-calibrating NLP transformers...",
  "[FACT_CHECK_NODE] Purging outdated knowledge graphs...",
  "[DB_SYNC] Synchronizing with global news databases...",
  "[SECURITY] Enhancing threat-detection algorithms...",
  "[PIPELINE] Optimizing 6-agent latency...",
  "[NETWORK] Establishing secure data tunnels...",
  "[CORE] Allocating neural resources...",
];

export default function MaintenancePage() {
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Booting maintenance sequence..."]);
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 400);

  // Smooth out mouse movement for parallax
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, LOG_MESSAGES[currentIndex]];
        if (newLogs.length > 5) newLogs.shift();
        return newLogs;
      });
      currentIndex = (currentIndex + 1) % LOG_MESSAGES.length;
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div 
      className="min-h-screen bg-[#030303] text-white overflow-hidden relative selection:bg-orange-500/30"
      onMouseMove={handleMouseMove}
    >
      {/* Interactive Cursor Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px z-0 opacity-50 transition duration-300"
        style={{
          background: useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(249, 115, 22, 0.12), transparent 80%)`,
        }}
      />

      {/* Ambient glowing background matched to LandingPage theme */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[800px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.12),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-orange-600/10 blur-[120px]" />
        <div className="absolute top-1/4 right-0 h-[500px] w-[500px] rounded-full bg-red-900/10 blur-[100px]" />
        <div className="luxury-grid absolute inset-0 opacity-[0.3]" />
      </div>

      {/* Floating data particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-500/40 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              scale: Math.random() * 2,
            }}
            animate={{
              y: [null, Math.random() * -500],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 lg:px-12 max-w-[90rem] mx-auto gap-12 lg:gap-24">
        
        {/* Left Side: Text and Status */}
        <div className="flex-1 max-w-2xl text-left z-20 pt-20 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-2 text-sm font-medium text-orange-200 shadow-[0_0_20px_rgba(249,115,22,0.1)] backdrop-blur-2xl">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Status: Offline
            </div>
            
            <h1 className="font-serif text-[clamp(3.5rem,8vw,6rem)] leading-[0.95] tracking-tight text-white mb-6">
              System <br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-500 to-red-500">
                Maintenance
              </span>
            </h1>
            
            <p className="max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg mb-10">
              We are currently performing scheduled maintenance to improve our systems. We will be back online shortly with enhanced stability and performance. Thank you for your patience.
            </p>


            
            <div className="mt-8 flex items-start gap-3 text-sm text-zinc-500 max-w-xl">
              <ShieldAlert className="h-5 w-5 text-orange-500/50 shrink-0" />
              <p>
                All verification records and user encryption keys remain fully isolated and secured during this operation.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Visualizer and Logs */}
        <div className="flex-1 w-full max-w-lg relative z-10 flex flex-col items-center justify-center pb-20 lg:pb-0">
          
          {/* Parallax 3D-like Core Visualizer */}
          <motion.div 
            className="relative w-72 h-72 mb-16 flex items-center justify-center"
            style={{
              x: useTransform(smoothX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [-40, 40]),
              y: useTransform(smoothY, [0, typeof window !== 'undefined' ? window.innerHeight : 800], [-40, 40]),
            }}
          >
            {/* Outer rings */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-orange-500/20"
                style={{
                  borderStyle: i % 2 === 0 ? 'dashed' : 'solid',
                  borderWidth: i === 1 ? '2px' : '1px',
                  opacity: 1 - i * 0.15,
                }}
                animate={{ 
                  rotate: i % 2 === 0 ? 360 : -360,
                  scale: [1 + i * 0.15, 1.05 + i * 0.15, 1 + i * 0.15]
                }}
                transition={{ 
                  rotate: { duration: 25 + i * 5, repeat: Infinity, ease: "linear" },
                  scale: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" }
                }}
              />
            ))}
            
            {/* Inner Core */}
            <div className="absolute inset-12 bg-orange-500/10 rounded-full backdrop-blur-md border border-orange-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(249,115,22,0.25)]">
              <motion.div
                animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Network size={72} className="text-orange-400 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]" strokeWidth={1} />
              </motion.div>
            </div>
            
            {/* Data particles flying in orbital tracks */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2"
            >
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-orange-300 rounded-full shadow-[0_0_12px_rgba(253,186,116,1)]" />
              <div className="absolute bottom-0 right-1/2 w-2 h-2 bg-red-400 rounded-full shadow-[0_0_12px_rgba(248,113,113,1)]" />
            </motion.div>
          </motion.div>

          {/* Scrolling Terminal Logs */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-full max-w-sm glass-card border border-white/5 rounded-2xl p-5 h-48 overflow-hidden relative shadow-2xl"
            style={{
              x: useTransform(smoothX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [10, -10]),
              y: useTransform(smoothY, [0, typeof window !== 'undefined' ? window.innerHeight : 800], [10, -10]),
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#080808]/90 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#080808]/90 to-transparent z-10" />
            
            <div className="flex items-center gap-2 mb-4 px-1 relative z-20">
              <Terminal className="w-4 h-4 text-orange-500/70" />
              <span className="text-xs text-orange-500/70 font-mono uppercase tracking-widest">Live Agent Logs</span>
            </div>
            
            <div className="font-mono text-[11px] sm:text-xs text-zinc-400 flex flex-col gap-2.5 px-1 pb-4">
              {logs.map((log, i) => (
                <motion.div
                  key={`${log}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 leading-relaxed"
                >
                  <span className="text-orange-500/70 shrink-0">{'>'}</span>
                  <span className={log.includes("ERROR") ? "text-red-400" : "text-zinc-400"}>
                    {log}
                  </span>
                </motion.div>
              ))}
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-3.5 bg-orange-500/60 mt-1 ml-5"
              />
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
