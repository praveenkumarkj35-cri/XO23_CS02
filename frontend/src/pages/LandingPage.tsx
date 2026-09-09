import React from 'react';
import {
  ShieldAlert,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  Activity,
  AlertTriangle,
  FileCode,
  Users,
  Eye,
  Terminal,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { NavigationTab } from '../components/Navigation';

interface Props {
  onNavigate: (tab: NavigationTab) => void;
}

export const LandingPage: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 font-sans pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 max-w-6xl mx-auto text-center overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 text-xs font-mono mb-6 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>CYBERSECURITY HACKATHON PROTOTYPE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white uppercase">
          TRUSTNEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">AI</span>
        </h1>

        <p className="mt-4 text-xl sm:text-2xl font-bold font-mono text-cyan-300 tracking-wide">
          Adaptive Behavioral Trust for Non-Human Identities
        </p>

        <p className="mt-4 text-lg font-mono text-slate-300 max-w-2xl mx-auto italic">
          "Trust Behavior. Not Just Identity."
        </p>

        <p className="mt-4 text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
          In modern cloud workloads, service accounts and APIs outnumber humans 45:1. 
          Static credentials like API keys and tokens can be stolen. TrustNexus AI continuously enforces behavioral baselines, stops gradual baseline poisoning, and verifies legitimacy before updating trust boundaries.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={() => onNavigate('command-center')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            <Lock className="w-4 h-4" />
            <span>Launch Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('slow-burn')}
            className="px-5 py-3 rounded-xl border border-orange-500/50 bg-orange-950/30 hover:bg-orange-950/50 text-orange-300 font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(249,115,22,0.3)] glow-orange"
          >
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
            <span>SC2: Slow-Burn Showcase</span>
          </button>

          <button
            onClick={() => onNavigate('judge-demo')}
            className="px-5 py-3 rounded-xl border border-violet-500/50 bg-violet-950/30 hover:bg-violet-950/50 text-violet-200 font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 glow-violet"
          >
            <Zap className="w-4 h-4 text-violet-400" />
            <span>Judge Demo Walkthrough</span>
          </button>
        </div>

        {/* Security Axiom Pill */}
        <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs font-mono text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Core Axiom: <strong>Valid credentials ≠ Trusted behavior</strong></span>
        </div>
      </section>

      {/* Architecture Pipeline Visualization */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="glass-card p-6 md:p-8 border border-slate-800 bg-[#0B0F1A]/95">
          <div className="text-center mb-8">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
              Autonomous Behavioral Architecture
            </span>
            <h2 className="text-2xl font-bold font-mono text-white mt-1">
              How TrustNexus AI Protects Non-Human Workloads
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center text-xs font-mono">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <div className="font-bold text-white">1. NHI Activity</div>
              <p className="text-[10px] text-slate-400 mt-1">APIs, Service Accounts, CI/CD, Workloads</p>
            </div>

            <div className="text-center text-cyan-500 font-bold hidden md:block">➔</div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <Layers className="w-6 h-6 mx-auto mb-2 text-teal-400" />
              <div className="font-bold text-white">2. Behavioral Baseline</div>
              <p className="text-[10px] text-slate-400 mt-1">Per-identity unique action, rate & resource profile</p>
            </div>

            <div className="text-center text-cyan-500 font-bold hidden md:block">➔</div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <Cpu className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
              <div className="font-bold text-white">3. Statistical Engine</div>
              <p className="text-[10px] text-slate-400 mt-1">Z-Score, EWMA, Action Novelty, Sequence Anomaly</p>
            </div>

            <div className="text-center text-cyan-500 font-bold hidden md:block">➔</div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 text-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
              <div className="font-bold text-cyan-300">4. Adaptive Trust Gate</div>
              <p className="text-[10px] text-slate-300 mt-1">Safe ➔ Update Baseline<br/>Unsafe ➔ Block + Alert</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Required Trust States */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
            Dynamic State Machine
          </span>
          <h2 className="text-2xl font-bold font-mono text-white mt-1">
            The Four Pillars of Behavioral Trust
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto font-sans">
            Legitimate workload evolution must be distinguishable from an attack. TrustNexus does not treat every deviation as malicious.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Normal */}
          <div className="glass-card p-5 border border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-400/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🟢</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                RISK: 0 - 29
              </span>
            </div>
            <h3 className="text-base font-bold font-mono text-emerald-400 mt-3">NORMAL</h3>
            <p className="text-xs text-slate-300 mt-2 font-sans">
              Behavior conforms strictly with the NHI's established baseline metrics, expected hours, and resource bounds.
            </p>
          </div>

          {/* Drifting */}
          <div className="glass-card p-5 border border-amber-500/30 bg-amber-950/10 hover:border-amber-400/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🟡</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                RISK: 30 - 54
              </span>
            </div>
            <h3 className="text-base font-bold font-mono text-amber-400 mt-3">DRIFTING</h3>
            <p className="text-xs text-slate-300 mt-2 font-sans">
              Behavior changed, but may be legitimate. Subjected to the Adaptive Trust Gate for verification and safe adaptation.
            </p>
          </div>

          {/* Suspicious */}
          <div className="glass-card p-5 border border-orange-500/30 bg-orange-950/10 hover:border-orange-400/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🟠</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">
                RISK: 55 - 74
              </span>
            </div>
            <h3 className="text-base font-bold font-mono text-orange-400 mt-3">SUSPICIOUS</h3>
            <p className="text-xs text-slate-300 mt-2 font-sans">
              Multiple unusual behavioral indicators or elevated variance detected. Baseline updates automatically locked.
            </p>
          </div>

          {/* High-Risk */}
          <div className="glass-card p-5 border border-rose-500/30 bg-rose-950/10 hover:border-rose-400/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🔴</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                RISK: 75 - 100
              </span>
            </div>
            <h3 className="text-base font-bold font-mono text-rose-400 mt-3">HIGH-RISK</h3>
            <p className="text-xs text-slate-300 mt-2 font-sans">
              Strong evidence of token hijack, lateral movement, data exfiltration, or baseline poisoning attack. Immediate alert raised.
            </p>
          </div>
        </div>
      </section>

      {/* Baseline Poisoning Defense Highlight */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="glass-card p-6 md:p-8 border border-slate-800 bg-[#0B0F1A]/95">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-950/40 text-orange-400 text-xs font-mono mb-3">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>ACTIVE DEFENSE CAPABILITY</span>
              </div>
              <h2 className="text-2xl font-bold font-mono text-white">
                Defeating the "Boiling Frog" Poisoning Attack
              </h2>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed font-sans">
                Adversaries aware of AI baselines deliberately manipulate NHI behavior across days or weeks: starting with minor resource access, escalating to staging buckets, and eventually seizing crown jewels.
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                TrustNexus AI monitors cumulative micro-drift across temporal horizons. When cumulative suspicion exceeds threshold, the system flags the multi-stage attack and activates:
              </p>
              <div className="mt-4 p-3 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 font-mono text-xs font-bold flex items-center gap-2">
                <span>🛑 BASELINE UPDATE BLOCKED & IDENTITY ISOLATED</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs space-y-2">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Attack Progression Pipeline</div>
              <div className="p-2.5 rounded bg-slate-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-between">
                <span>1. Day 1: Normal DB Query</span>
                <span className="font-bold">🟢 NORMAL</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-amber-500/30 text-amber-400 flex items-center justify-between">
                <span>2. Day 5: Minor Resource Access</span>
                <span className="font-bold">🟡 DRIFTING</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-orange-500/30 text-orange-400 flex items-center justify-between">
                <span>3. Day 10: Unusual Action Spike</span>
                <span className="font-bold">🟠 SUSPICIOUS</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-rose-500/50 text-rose-400 flex items-center justify-between shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                <span>4. Day 15: Crown Jewels Targeted</span>
                <span className="font-bold">🛑 POISONING DETECTED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Quick Launch */}
      <section className="text-center pt-8 border-t border-slate-800 max-w-6xl mx-auto px-4 font-mono text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            TRUSTNEXUS AI • Adaptive Behavioral Trust for Non-Human Identities
          </div>
          <button
            onClick={() => onNavigate('command-center')}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
          >
            Enter Operations Console <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
