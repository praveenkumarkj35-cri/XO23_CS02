import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Activity, 
  ChevronRight,
  Sparkles,
  ArrowRight,
  Award,
  Flame,
  Clock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { 
  startJudgeDemo, 
  resetJudgeDemo, 
  executeJudgeDemoStep, 
  fetchJudgeDemoStatus 
} from '../services/api';
import { WebSocketPayload, JudgeDemoStatus } from '../types';

interface Props {
  wsPayload: WebSocketPayload | null;
  onNavigateToTab?: (tab: any) => void;
}

const JUDGE_STEPS = [
  {
    step: 1,
    title: "1. Steady-State Baseline",
    category: "NORMAL",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/40 glow-green",
    description: "Verified steady-state operations within established baseline boundaries.",
    scenario: "normal",
    expectedOutcome: "Trust: 96% | Risk: Low (<15) | State: NORMAL"
  },
  {
    step: 2,
    title: "2. Workload Evolution Intro",
    category: "LEGITIMATE DRIFT",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/40 glow-cyan",
    description: "Authorized workload shift introducing audit_metrics_db at moderate velocity.",
    scenario: "drift",
    expectedOutcome: "Trust: DRIFTING | Risk: Moderate (~28) | Evaluation: PENDING"
  },
  {
    step: 3,
    title: "3. Sustained Workload Shift",
    category: "LEGITIMATE DRIFT",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/40 glow-cyan",
    description: "Telemetry pattern observed repeatedly with stable frequency and internal ingress.",
    scenario: "drift",
    expectedOutcome: "Stability: High | Velocity: Safe | Cumulative Trust: Preserved"
  },
  {
    step: 4,
    title: "4. Adaptive Gate Approval",
    category: "BASELINE ADAPTED",
    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/40",
    description: "Adaptive Trust Gate approves legitimate drift, updating baseline to Version 2.",
    scenario: "drift",
    expectedOutcome: "Decision: APPROVED | Baseline: v2 | Resources merged safely"
  },
  {
    step: 5,
    title: "5. Sudden Attack Blocked",
    category: "ATTACK DEFENSE",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/40 glow-red",
    description: "Sudden token hijack attempting PII export via Tor exit node is instantly blocked.",
    scenario: "attack",
    expectedOutcome: "Risk: 88+ | Trust: HIGH-RISK | Gate: BLOCKED | Alert: CRITICAL"
  },
  {
    step: 6,
    title: "6. Stealth Poisoning Step 1",
    category: "POISONING ATTEMPT",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/40 glow-yellow",
    description: "Adversary injects low-profile novel resource (log_exporter_v2) to test baseline tolerance.",
    scenario: "poisoning",
    expectedOutcome: "Defense: SMALL_DRIFT | Suspicion Counter: +18 | Gate: Suspicious"
  },
  {
    step: 7,
    title: "7. Stealth Poisoning Step 2",
    category: "SUSPICION ESCALATION",
    badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/40 glow-orange",
    description: "Adversary increases request frequency on temp_staging_bucket across multiple calls.",
    scenario: "poisoning",
    expectedOutcome: "Defense: INCREASING_FREQUENCY | Suspicion: Elevated | Cumulative Tracker Active"
  },
  {
    step: 8,
    title: "8. Poisoning Defense Locked",
    category: "SURPRISE CHALLENGE 1",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/40 glow-violet",
    description: "Crown jewel access blocked! Baseline Poisoning Defense locks and preserves original baseline.",
    scenario: "poisoning",
    expectedOutcome: "State: BASELINE_PROTECTED | Baseline: UNPOISONED | Attack Mitigated"
  }
];

export const JudgeDemoPage: React.FC<Props> = ({ wsPayload, onNavigateToTab }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(1);
  const [backendStepIndex, setBackendStepIndex] = useState(0);
  const [localTelemetry, setLocalTelemetry] = useState<WebSocketPayload | null>(null);
  const [demoStatus, setDemoStatus] = useState<JudgeDemoStatus | null>(null);

  // Fetch initial demo status on mount
  useEffect(() => {
    fetchJudgeDemoStatus()
      .then(status => {
        setDemoStatus(status);
        if (status.current_step > 0) {
          setBackendStepIndex(status.current_step);
          setActiveStepIndex(status.current_step);
        }
        setIsRunning(status.is_running);
      })
      .catch(console.error);
  }, []);

  // Sync with incoming WebSocket Judge Demo payload if active
  useEffect(() => {
    if (wsPayload?.judge_demo) {
      const step = wsPayload.judge_demo.step;
      setActiveStepIndex(step);
      setBackendStepIndex(step);
      setIsRunning(!wsPayload.judge_demo.is_complete);
      setLocalTelemetry(null);
      if (wsPayload.judge_demo.is_complete) {
        fetchJudgeDemoStatus().then(setDemoStatus).catch(console.error);
      }
    }
  }, [wsPayload]);

  const handleStartDemo = async () => {
    try {
      setIsRunning(true);
      setActiveStepIndex(1);
      setBackendStepIndex(1);
      setLocalTelemetry(null);
      await startJudgeDemo();
    } catch (err) {
      console.error('Failed to start Judge Demo:', err);
      setIsRunning(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsRunning(false);
      setIsStepping(false);
      setActiveStepIndex(1);
      setBackendStepIndex(0);
      setLocalTelemetry(null);
      await resetJudgeDemo();
      const status = await fetchJudgeDemoStatus();
      setDemoStatus(status);
    } catch (err) {
      console.error('Failed to reset Judge Demo:', err);
    }
  };

  // Step forward using real backend simulation API call
  const handleNextStep = async () => {
    if (isRunning || isStepping) return;
    const targetStep = Math.min(8, Math.max(1, backendStepIndex + 1));
    if (targetStep > 8) return;

    setIsStepping(true);
    try {
      const res = await executeJudgeDemoStep(targetStep);
      const step = res.step;
      setBackendStepIndex(step);
      setActiveStepIndex(step);
      if (res.payload) {
        setLocalTelemetry(res.payload);
      }
      if (res.status_summary) {
        setDemoStatus(res.status_summary);
      } else {
        const status = await fetchJudgeDemoStatus();
        setDemoStatus(status);
      }
    } catch (err) {
      console.error(`Failed to execute step ${targetStep}:`, err);
    } finally {
      setIsStepping(false);
    }
  };

  const handlePreviousStep = () => {
    if (isRunning) return;
    setActiveStepIndex(prev => Math.max(1, prev - 1));
  };

  const handleSelectTimelineStep = (stepNum: number) => {
    if (isRunning) return;
    setActiveStepIndex(stepNum);
  };

  const activePayload = localTelemetry || wsPayload;
  const isComplete = Boolean(demoStatus?.is_complete || (backendStepIndex >= 8 && !isRunning));

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-violet-500/30">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#0B0E1B] to-slate-950 border border-violet-500/30 p-5 md:p-6 shadow-2xl hud-border">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black font-mono tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/40 glow-violet uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Hackathon Showcase Mode
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                8-STEP INVARIANT VERIFIER
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black font-mono tracking-tight text-white">
              TrustNexus Judge Demonstration Suite
            </h1>

            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono leading-relaxed">
              Designed specifically for hackathon evaluation: sequentially proves both <strong className="text-cyan-300">Adaptive Behavioral Trust (PS02)</strong> and <strong className="text-purple-300">Baseline Poisoning Resistance (Surprise Challenge 1)</strong> in under 60 seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleStartDemo}
              disabled={isRunning || isStepping}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-black flex items-center gap-2 transition-all ${
                isRunning 
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isRunning ? 'Demo Streaming...' : 'Start Automated Demo'}</span>
            </button>

            <button
              onClick={handleReset}
              disabled={isStepping}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('slow-burn')}
                className="px-3 py-2.5 rounded-xl border border-orange-500/40 bg-orange-950/20 hover:bg-orange-500/25 text-orange-300 text-xs font-bold font-mono flex items-center gap-1.5 transition-all glow-orange"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Open SC2 Page</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* The Core Invariants Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
        <div className="glass-card p-4.5 rounded-xl border-cyan-500/30 bg-cyan-950/15">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wide">PS02 Core Invariant</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Legitimate Workload Drift Adapts Safely:</strong> Steps 1–4 demonstrate that when an NHI adopts a new resource at safe velocities, the Adaptive Trust Gate approves the change and increments the baseline to v2 without false positives.
          </p>
        </div>

        <div className="glass-card p-4.5 rounded-xl border-purple-500/30 bg-purple-950/15">
          <div className="flex items-center gap-2 mb-1.5">
            <Lock className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-black text-purple-300 uppercase tracking-wide">Surprise Challenge 1 Invariant</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Baseline Poisoning Resistance:</strong> Steps 6–8 demonstrate that stealthy incremental deviations accumulate suspicion. The defense locks BEFORE crown jewels are corrupted, ensuring the original baseline remains unpoisoned.
          </p>
        </div>
      </div>

      {/* 8-Step Timeline Horizontal / Vertical Visualizer */}
      <div className="glass-card p-5 md:p-6 border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-black font-mono uppercase text-white tracking-wide">
              Showcase Execution Pipeline (Steps 1–8)
            </h2>
          </div>
          <span className="text-xs font-mono text-cyan-300 font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            Selected: Step {activeStepIndex} &bull; Backend: {backendStepIndex}/8
          </span>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {JUDGE_STEPS.map((s) => {
            const isCurrent = activeStepIndex === s.step;
            const isCompleted = backendStepIndex >= s.step;

            return (
              <div
                key={s.step}
                onClick={() => handleSelectTimelineStep(s.step)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative font-mono ${
                  isCurrent 
                    ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400' 
                    : isCompleted
                      ? 'bg-slate-950/60 border-emerald-500/40 hover:border-emerald-500/60'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/50'
                }`}
              >
                {/* Step badge & state */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${s.badgeColor}`}>
                    {s.category}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600">Step {s.step}</span>
                  )}
                </div>

                <h4 className="text-xs font-black text-white mb-1">{s.title}</h4>
                <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">{s.description}</p>

                <div className="pt-2 border-t border-slate-800/60 text-[10px] text-cyan-300">
                  {s.expectedOutcome}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live System State Inspector during Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
        {/* Active Step Details */}
        <div className="lg:col-span-6 glass-card p-5 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase">
                Current Showcase Step Detail
              </h3>
              <span className="text-xs text-cyan-400 font-bold">
                Inspecting Step {activeStepIndex} / 8
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4">
              <div className="text-sm font-bold text-white mb-1">
                {JUDGE_STEPS[activeStepIndex - 1]?.title}
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {JUDGE_STEPS[activeStepIndex - 1]?.description}
              </p>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-cyan-300">
                Expected Outcome: {JUDGE_STEPS[activeStepIndex - 1]?.expectedOutcome}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={handlePreviousStep}
              disabled={isRunning || isStepping || activeStepIndex <= 1}
              className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 text-xs text-slate-300 transition-colors"
            >
              ← Previous Step
            </button>
            <button
              onClick={handleNextStep}
              disabled={isRunning || isStepping || backendStepIndex >= 8}
              className="px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-40 text-xs text-cyan-300 font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            >
              <span>{isStepping ? 'Executing Backend Step...' : 'Execute Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-time Event Telemetry */}
        <div className="lg:col-span-6 glass-card p-5 border-slate-800">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase">
              Live Engine Output from Step
            </h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Telemetry Stream
            </span>
          </div>

          {activePayload?.event ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">ACTION &bull; RESOURCE</span>
                  <span className="text-cyan-400 font-bold">{activePayload.event.action}</span>
                  <span className="text-slate-400"> on </span>
                  <span className="text-slate-200 truncate block">{activePayload.event.resource}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">RISK SCORE &bull; TRUST STATE</span>
                  <span className="text-white font-bold text-base">{activePayload.event.risk_score}</span>
                  <span className="text-slate-400"> | </span>
                  <span className={activePayload.event.trust_state === 'NORMAL' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {activePayload.event.trust_state}
                  </span>
                </div>
              </div>

              {/* Baseline Decision & Attack Stage */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">ADAPTIVE GATE DECISION</span>
                  <span className={`font-bold ${activePayload.baseline_change?.decision === 'APPROVED' ? 'text-emerald-400' : activePayload.baseline_change?.decision === 'BLOCKED' ? 'text-rose-400' : 'text-slate-400'}`}>
                    {activePayload.baseline_change?.decision || 'STEADY_STATE'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">POISONING DEFENSE STAGE</span>
                  <span className="text-purple-400 font-bold">
                    {activePayload.poisoning_state?.attack_stage || 'NORMAL'}
                  </span>
                </div>
              </div>

              {/* Explanation */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">ANALYTICS EXPLANATION</span>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{activePayload.event.explanation}</p>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500 text-xs">
              Click &quot;Start Automated Demo&quot; or &quot;Execute Next Step&quot; above to trigger actual backend behavior.
            </div>
          )}
        </div>
      </div>

      {/* Final Summary Card — Shown when backend reports is_complete = true */}
      {isComplete && demoStatus?.verdicts && (
        <div className="glass-card p-6 md:p-8 border-2 border-emerald-500/50 bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 glow-green">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black font-mono text-white">
                    Judge Demonstration Verified
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ALL 4 INVARIANTS CONFIRMED
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  All 8 demonstration stages executed against live backend behavioral analytics engines.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-slate-400">
                Trusted Baseline Version:
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                v{demoStatus.summary?.trusted_baseline_version || 2}
              </span>
            </div>
          </div>

          {/* 4 Invariant Verdicts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/40 space-y-1.5 glow-green">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase">PS02 Drift Evolution</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {demoStatus.verdicts.legitimate_evolution}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Adaptive Trust Gate automatically promoted novel resource to Baseline v2.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-rose-500/40 space-y-1.5 glow-red">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Sudden Attack</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {demoStatus.verdicts.sudden_attack}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                High-risk Tor exfiltration instantly rejected with 0 delay.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/40 space-y-1.5 glow-violet">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Surprise Challenge 1</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                  {demoStatus.verdicts.baseline_poisoning}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Cumulative suspicion counter locked before crown jewel corruption.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/40 space-y-1.5 glow-cyan">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Trusted Baseline</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  {demoStatus.verdicts.trusted_baseline}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Original baseline preserved pristine without unapproved contamination.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeDemoPage;
