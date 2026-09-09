import React, { useState } from 'react';
import { Identity, SecurityEvent } from '../types';
import { GitCompare, ArrowRight, Zap, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TrustStateBadge } from '../components/TrustStateBadge';
import { RiskBadge } from '../components/RiskBadge';

interface Props {
  identities: Identity[];
  events: SecurityEvent[];
}

export const DriftDetectionPage: React.FC<Props> = ({ identities, events }) => {
  const [selectedId, setSelectedId] = useState<string>('payment-service');

  const identity = identities.find((i) => i.id === selectedId) || identities[0];
  const profile = identity?.profile;
  const latestEvent = events.find((e) => e.identity_id === identity?.id);

  // Compute deviations
  const baseRate = profile?.average_request_rate || 100;
  const currentRate = latestEvent?.request_rate || baseRate;
  const rateDevPct = Math.round(((currentRate - baseRate) / baseRate) * 100);

  const baseResources = profile?.normal_resources || [];
  const currentResource = latestEvent?.resource || baseResources[0] || 'none';
  const isNewResource = !baseResources.includes(currentResource);

  const baseActions = profile?.normal_actions || [];
  const currentAction = latestEvent?.action || baseActions[0] || 'READ';
  const isNewAction = !baseActions.includes(currentAction);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-amber-400" />
            BEHAVIORAL DRIFT DETECTION ENGINE
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Direct side-by-side delta between established historical profile and current runtime telemetry.
          </p>
        </div>

        {/* Identity Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-slate-400">Target NHI:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            {identities.map((idn) => (
              <option key={idn.id} value={idn.id}>
                {idn.name} ({idn.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trust State Diagnosis Card */}
      <div className="glass-card p-5 border border-amber-500/30 bg-amber-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-white">{identity.name}</span>
                <TrustStateBadge state={identity.current_state} size="sm" />
              </div>
              <p className="text-xs text-slate-300 mt-1 font-sans">
                {identity.current_state === 'DRIFTING'
                  ? 'Behavioral divergence detected. Evaluating against Adaptive Trust Gate for safe workload evolution approval.'
                  : identity.current_state === 'NORMAL'
                  ? 'Runtime activity remains tightly aligned with established baseline tolerances.'
                  : 'Critical variance or unapproved lateral deviation detected.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <RiskBadge score={identity.risk_score} size="md" showLabel />
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison: Baseline vs Current */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Established Baseline Column */}
        <div className="glass-card p-6 border border-slate-800 bg-[#0B0F1A]/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              ESTABLISHED VERIFIED BASELINE
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              v{profile?.version || 1} APPROVED
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block mb-1">Allowed Resources:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {baseResources.map((r, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block mb-1">Expected Actions:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {baseActions.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-bold">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block mb-1">Expected Request Frequency:</span>
              <div className="text-lg font-bold text-white mt-1">
                {baseRate} <span className="text-xs font-normal text-slate-400">requests/min</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 block mb-1">Operating Hours:</span>
              <div className="text-slate-200 mt-1">
                {profile ? `${String(profile.normal_hours_start).padStart(2, '0')}:00 – ${String(profile.normal_hours_end).padStart(2, '0')}:00 UTC` : '24/7'}
              </div>
            </div>
          </div>
        </div>

        {/* Current Active Telemetry Column */}
        <div className="glass-card p-6 border border-amber-500/30 bg-[#0B0F1A]/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              CURRENT OBSERVED BEHAVIOR
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              RUNTIME TELEMETRY
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className={`p-3.5 rounded-lg border ${isNewResource ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900/80 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Observed Target Resource:</span>
                {isNewResource && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    NEW RESOURCE DETECTED
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-white mt-1">
                {currentResource}
              </div>
            </div>

            <div className={`p-3.5 rounded-lg border ${isNewAction ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900/80 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Observed Action:</span>
                {isNewAction && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    NEW ACTION DETECTED
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-amber-300 mt-1">
                {currentAction}
              </div>
            </div>

            <div className={`p-3.5 rounded-lg border ${rateDevPct > 30 ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-900/80 border-slate-800'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">Observed Frequency:</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${rateDevPct > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                  {rateDevPct >= 0 ? `+${rateDevPct}%` : `${rateDevPct}%`} Frequency Deviation
                </span>
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {currentRate} <span className="text-xs font-normal text-slate-400">requests/min</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block mb-1">Event Ingress Source:</span>
              <div className="text-slate-200 mt-1">
                {latestEvent?.source || 'internal-service'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drift Metrics Summary Card */}
      <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-3">
          Automated Drift Quantification
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500">Resource Status:</span>
            <div className="text-white font-bold mt-1">
              {isNewResource ? '⚠️ Novel Resource (Not in Baseline)' : '✓ Matches Baseline'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500">Action Status:</span>
            <div className="text-white font-bold mt-1">
              {isNewAction ? '⚠️ Novel Action Detected' : '✓ Verified Normal Action'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-500">Rate Anomaly:</span>
            <div className="text-white font-bold mt-1">
              {rateDevPct > 50 ? `🚨 High Spike (${rateDevPct}%)` : rateDevPct > 15 ? `⚠️ Moderate Drift (+${rateDevPct}%)` : '✓ Within Range'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
