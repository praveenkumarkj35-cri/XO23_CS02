import React from 'react';
import { SimulationPanel } from '../components/SimulationPanel';
import { LiveEventStream } from '../components/LiveEventStream';
import { SecurityEvent, Identity } from '../types';
import { Terminal, ShieldAlert, Zap, ShieldCheck, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  events: SecurityEvent[];
  identities: Identity[];
  currentScenario: string;
  stepIndex: number;
}

export const AttackSimulatorPage: React.FC<Props> = ({
  events,
  identities,
  currentScenario,
  stepIndex
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            ATTACK SIMULATOR & ADAPTIVE STRESS STATION
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Real-time synthetic threat simulation testing baseline resilience, poisoning defense, and dynamic trust gate states.
          </p>
        </div>
      </div>

      {/* Simulator Control Dock */}
      <SimulationPanel
        activeScenario={currentScenario}
        stepIndex={stepIndex}
        targetIdentity="payment-service"
      />

      {/* Live Stream & Step Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[460px]">
          <LiveEventStream events={events} maxItems={8} />
        </div>

        {/* Hackathon Judge Demo Script & Walkthrough */}
        <div className="glass-card p-6 border border-cyan-500/30 bg-[#0B0F1A]/95 space-y-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider border-b border-slate-800 pb-2">
            <HelpCircle className="w-4 h-4" />
            Official Hackathon Judge Demo Walkthrough
          </div>

          <p className="text-slate-300 font-sans leading-relaxed">
            Follow this step-by-step presentation script to demonstrate the core value proposition of TrustNexus AI to judges:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <span>1. Baseline Stability</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/30">
                  ▶ Normal
                </span>
              </div>
              <p className="text-slate-400 font-sans mt-1">
                Generates typical payments workload (100 req/min, payment_db). Shows 🟢 NORMAL state with 98% confidence.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-amber-400 font-bold flex items-center gap-2">
                <span>2. Legitimate Workload Evolution</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/30">
                  ▶ Legitimate Drift
                </span>
              </div>
              <p className="text-slate-400 font-sans mt-1">
                Workload connects to new internal telemetry database. System transitions to 🟡 DRIFTING, validates stability in the Adaptive Trust Gate, and automatically merges it as a SAFE ADAPTATION.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-rose-400 font-bold flex items-center gap-2">
                <span>3. Sudden High-Velocity Attack</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 border border-rose-500/30">
                  ▶ Sudden Attack
                </span>
              </div>
              <p className="text-slate-400 font-sans mt-1">
                Compromised credentials trigger 4.5x rate burst targeting vault keys with DELETE action from an external TOR node. System triggers 🔴 HIGH-RISK, raises critical alert, and strictly BLOCKS baseline updates.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-orange-400 font-bold flex items-center gap-2">
                <span>4. Boiling-Frog Baseline Poisoning</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-950 border border-orange-500/30">
                  ▶ Poisoning
                </span>
              </div>
              <p className="text-slate-400 font-sans mt-1">
                Adversary makes small incremental changes across multiple events. System accumulates suspicion score, flags cumulative manipulation, and triggers 🛑 POISONING DETECTED & BASELINE BLOCKED.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
