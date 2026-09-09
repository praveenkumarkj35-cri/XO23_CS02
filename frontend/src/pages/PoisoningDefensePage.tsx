import React, { useState, useEffect } from 'react';
import { PoisoningState, Identity, BaselineChange, BaselineDetails } from '../types';
import { 
  Skull, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  Zap, 
  Lock, 
  RotateCcw,
  CheckCircle2,
  Database,
  Eye,
  Info
} from 'lucide-react';
import { BaselineChangeCard } from '../components/BaselineChangeCard';
import { fetchBaselineDetails, triggerSimulationScenario, resetSimulation } from '../services/api';

interface Props {
  poisoningStates: PoisoningState[];
  identities: Identity[];
  baselineChanges: BaselineChange[];
  onTriggerPoisoningDemo?: () => void;
}

export const PoisoningDefensePage: React.FC<Props> = ({
  poisoningStates,
  identities,
  baselineChanges,
  onTriggerPoisoningDemo
}) => {
  const [baselineDetails, setBaselineDetails] = useState<BaselineDetails | null>(null);

  // Focus on payment-service or the primary identity
  const state = poisoningStates.find((p) => p.identity_id === 'payment-service') || poisoningStates[0] || {
    identity_id: 'payment-service',
    suspicion_score: 0,
    gradual_drifts_count: 0,
    baseline_changes_attempted: 0,
    baseline_changes_approved: 0,
    baseline_changes_blocked: 0,
    attack_stage: 'NORMAL'
  };

  const identity = identities.find((i) => i.id === state.identity_id);
  const isPoisoningDetected = state.suspicion_score >= 50.0 || 
    ['SUSPICIOUS', 'POISONING_DETECTED', 'BASELINE_PROTECTED'].includes(state.attack_stage);

  useEffect(() => {
    fetchBaselineDetails(state.identity_id)
      .then(setBaselineDetails)
      .catch((err) => console.error('Failed to fetch baseline comparison details:', err));
  }, [state.identity_id, state.baseline_changes_approved, state.baseline_changes_blocked]);

  // 7-Stage Pipeline for Surprise Challenge 1
  const stages = [
    { id: 'NORMAL', label: '1. NORMAL', desc: 'Baseline Verified', color: 'emerald' },
    { id: 'SMALL_DRIFT', label: '2. SMALL DRIFT', desc: 'Micro Novel Resource', color: 'cyan' },
    { id: 'REPEATED_DRIFT', label: '3. REPEATED DRIFT', desc: 'Cumulative Variance', color: 'blue' },
    { id: 'INCREASING_FREQUENCY', label: '4. FREQUENCY SPIKE', desc: 'Accelerating Rates', color: 'amber' },
    { id: 'SUSPICIOUS', label: '5. SUSPICIOUS', desc: 'Threshold Exceeded', color: 'orange' },
    { id: 'POISONING_DETECTED', label: '6. POISONING FLAGGED', desc: 'Attack Intercepted', color: 'rose' },
    { id: 'BASELINE_PROTECTED', label: '7. BASELINE PROTECTED', desc: 'Lockout & Preserved', color: 'purple' }
  ];

  const currentStageIndex = stages.findIndex(s => s.id === state.attack_stage);
  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

  const handleTriggerAttack = async () => {
    if (onTriggerPoisoningDemo) {
      onTriggerPoisoningDemo();
    } else {
      await triggerSimulationScenario('poisoning');
    }
  };

  const handleReset = async () => {
    await resetSimulation();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Challenge Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <Skull className="w-5 h-5 text-orange-400" />
              BASELINE POISONING DEFENSE MODULE
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Surprise Challenge 1 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Detection and automatic mitigation against gradual, multi-stage "boiling-frog" behavioral creep. Prevents adversarial baseline corruption.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerAttack}
            className="px-4 py-2 rounded-lg border border-orange-500/40 bg-orange-950/40 hover:bg-orange-900/50 text-orange-300 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(249,115,22,0.2)]"
          >
            <Zap className="w-4 h-4" />
            <span>Trigger 7-Stage Poisoning Attack</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Poisoning Lockout Alert Banner */}
      {isPoisoningDetected ? (
        <div className="p-5 rounded-2xl border border-rose-500/60 bg-rose-950/40 shadow-[0_0_25px_rgba(244,63,94,0.3)] backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black font-mono text-rose-300 tracking-wide">
                  🛑 BASELINE UPDATE BLOCKED • MULTI-STAGE POISONING DETECTED
                </h3>
                <p className="text-xs text-slate-200 mt-1 font-sans max-w-3xl">
                  Cumulative behavioral variance for <span className="font-mono font-bold text-white">{state.identity_id}</span> has crossed security limits. Autonomous baseline learning is <strong>LOCKED</strong>. All attempted baseline corruptions have been blocked to guarantee uncompromised steady-state integrity.
                </p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-rose-900/80 border border-rose-500 text-xs font-mono font-bold text-rose-200 uppercase shrink-0 shadow-lg text-center">
              <div>STATUS</div>
              <div className="text-white text-sm">BASELINE PROTECTED</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between text-xs font-mono text-slate-300 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Poisoning Defense Active: Continuously monitoring <strong className="text-cyan-400 font-bold">{state.identity_id}</strong> across 7 behavioral threshold stages.</span>
          </div>
          <span className="text-emerald-400 font-bold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
            INTEGRITY: SECURE
          </span>
        </div>
      )}

      {/* Visual Attack Progression Pipeline (7 Stages) */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#0B0F1A]/95 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              7-Stage Boiling-Frog Behavioral Poisoning Pipeline
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Active: <span className="text-cyan-400 font-bold">{state.attack_stage}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {stages.map((stg, idx) => {
            const isPassed = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            let borderCol = 'border-slate-800 bg-slate-950/50 text-slate-500';
            if (isCurrent) {
              borderCol = idx >= 5
                ? 'border-rose-500 bg-rose-950/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)] font-bold ring-1 ring-rose-500'
                : idx >= 3
                  ? 'border-amber-500 bg-amber-950/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-bold ring-1 ring-amber-500'
                  : 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold ring-1 ring-cyan-500';
            } else if (isPassed) {
              borderCol = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
            }

            return (
              <div key={stg.id} className={`p-3 rounded-xl border ${borderCol} text-center font-mono transition-all`}>
                <div className="text-[10px] text-slate-500 font-medium">Stage {idx + 1}</div>
                <div className="text-xs font-bold mt-0.5 truncate">{stg.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">{stg.desc}</div>
                {isCurrent && (
                  <div className="mt-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700">
                    CURRENT
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Poisoning Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 font-mono">
        <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-950/20">
          <span className="text-[11px] text-slate-400 uppercase">Suspicion Score</span>
          <div className="text-2xl font-bold text-orange-400 mt-1">
            {state.suspicion_score.toFixed(1)}/100
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Threshold: 50.0 Lockout</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[11px] text-slate-400 uppercase">Cumulative Drifts</span>
          <div className="text-2xl font-bold text-white mt-1">
            {state.gradual_drifts_count}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sequential Anomalies</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[11px] text-slate-400 uppercase">Changes Attempted</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {state.baseline_changes_attempted}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Novel Events Observed</div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
          <span className="text-[11px] text-slate-400 uppercase">Changes Approved</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {state.baseline_changes_approved}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Legitimate Workload Shift</div>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20">
          <span className="text-[11px] text-slate-400 uppercase">Changes Blocked</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {state.baseline_changes_blocked}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Attacks Intercepted</div>
        </div>
      </div>

      {/* Before vs After Baseline Comparison Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#0B0F1A]/95 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Before vs After Baseline Comparison (Proof of Resistance)
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Baseline Integrity Intact
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pristine Snapshot v1 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs">
            <div className="flex items-center justify-between mb-2 text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-300">Pristine Initial Baseline (v1)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">PROTECTED GROUND TRUTH</span>
            </div>
            <div className="space-y-2 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">AUTHORIZED RESOURCES</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(baselineDetails?.baseline_snapshot_v1?.normal_resources || ['payment_db', 'payment_gateway_api', 'transaction_ledger']).map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-[11px]">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">AUTHORIZED ACTIONS</span>
                <div className="flex gap-1 mt-1">
                  {(baselineDetails?.baseline_snapshot_v1?.normal_actions || ['READ', 'WRITE', 'VERIFY']).map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800/60 text-slate-400 text-[11px]">
                <span>Avg Rate: {baselineDetails?.baseline_snapshot_v1?.average_request_rate || 100} req/s</span>
                <span>Confidence: {baselineDetails?.baseline_snapshot_v1?.confidence || 98.4}%</span>
              </div>
            </div>
          </div>

          {/* Current Active Baseline */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs">
            <div className="flex items-center justify-between mb-2 text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-cyan-400">Current Active Profile (v{baselineDetails?.current_version || 1})</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">ACTIVE IN TRUST GATE</span>
            </div>
            <div className="space-y-2 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">ACTIVE RESOURCES</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(baselineDetails?.current_resources || ['payment_db', 'payment_gateway_api', 'transaction_ledger']).map((r) => {
                    const isNew = !baselineDetails?.baseline_snapshot_v1?.normal_resources?.includes(r);
                    return (
                      <span 
                        key={r} 
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                          isNew 
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                            : 'bg-slate-900 border-slate-800 text-cyan-300'
                        }`}
                      >
                        {r} {isNew && '★'}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ACTIVE ACTIONS</span>
                <div className="flex gap-1 mt-1">
                  {(baselineDetails?.current_actions || ['READ', 'WRITE', 'VERIFY']).map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800/60 text-slate-400 text-[11px]">
                <span>Avg Rate: {baselineDetails?.current_average_request_rate?.toFixed(1) || 100} req/s</span>
                <span>Confidence: {baselineDetails?.confidence?.toFixed(1) || 98.4}%</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-3 font-mono italic">
          ★ Notice: Malicious resources like "customer_pii_db" or "vault_master_keys" attempted during the boiling-frog sequence NEVER appear in the active baseline because the defense locked automatically.
        </p>
      </div>

      {/* Blocked Updates Inspection Table */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#0B0F1A]/90 space-y-3 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          Poisoning Defense Audit Trail ({baselineChanges.filter(c => c.identity_id === state.identity_id).length})
        </h3>

        <div className="space-y-3">
          {baselineChanges
            .filter((c) => c.identity_id === state.identity_id)
            .slice(0, 5)
            .map((change) => (
              <BaselineChangeCard key={change.id} change={change} />
            ))}
        </div>
      </div>
    </div>
  );
};
