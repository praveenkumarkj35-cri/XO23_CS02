import React, { useState, useEffect } from 'react';
import { BaselineChange, Identity, BaselineHistory, BaselineDetails } from '../types';
import { BaselineChangeCard } from '../components/BaselineChangeCard';
import { 
  GitPullRequest, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  Filter, 
  ShieldCheck, 
  History,
  Layers,
  ArrowRight,
  Database,
  Sparkles
} from 'lucide-react';
import { fetchBaselineDetails, fetchBaselineHistory } from '../services/api';

interface Props {
  baselineChanges: BaselineChange[];
  identities: Identity[];
  onDecisionMade?: (changeId: string, decision: 'APPROVED' | 'REJECTED') => void;
}

export const AdaptiveBaselinePage: React.FC<Props> = ({
  baselineChanges,
  identities,
  onDecisionMade
}) => {
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('payment-service');
  const [baselineDetails, setBaselineDetails] = useState<BaselineDetails | null>(null);
  const [baselineHistory, setBaselineHistory] = useState<BaselineHistory[]>([]);

  useEffect(() => {
    fetchBaselineDetails(selectedIdentityId)
      .then(setBaselineDetails)
      .catch(console.error);

    fetchBaselineHistory(selectedIdentityId)
      .then(setBaselineHistory)
      .catch(console.error);
  }, [selectedIdentityId, baselineChanges]);

  const filteredChanges = baselineChanges.filter((c) => {
    if (filterDecision === 'ALL') return true;
    return c.decision === filterDecision;
  });

  const approvedCount = baselineChanges.filter((c) => c.decision === 'APPROVED').length;
  const blockedCount = baselineChanges.filter((c) => c.decision === 'BLOCKED' || c.decision === 'REJECTED').length;
  const pendingCount = baselineChanges.filter((c) => c.decision === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-cyan-400" />
              ADAPTIVE BASELINE TRUST GATE
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              PS02 Core Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Autonomous behavioral gate enforcing strict validation rules before incorporating new patterns into verified NHI baselines.
          </p>
        </div>

        {/* Identity & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedIdentityId}
            onChange={(e) => setSelectedIdentityId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            {identities.map((id) => (
              <option key={id.id} value={id.id}>
                {id.name} ({id.id})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Decisions ({baselineChanges.length})</option>
              <option value="APPROVED">Approved Safe Adaptations ({approvedCount})</option>
              <option value="BLOCKED">Blocked by Security Gate ({blockedCount})</option>
              <option value="PENDING">Pending Review ({pendingCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trust Gate Evaluation Criteria Card */}
      <div className="p-5 rounded-2xl border border-cyan-500/30 bg-[#0B0F1A]/95 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Adaptive Trust Gate Autonomous Verification Criteria
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">1. Risk Ceiling</span>
            <span className="text-emerald-400">Score &lt; 45/100</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">2. Repetition</span>
            <span className="text-cyan-400">Observed multiple times</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">3. Velocity Stability</span>
            <span className="text-slate-300">EWMA rate tolerance</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">4. Context Legitimacy</span>
            <span className="text-slate-300">Verified VPC / internal</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">5. Poisoning Defense</span>
            <span className="text-purple-400">Cumulative score &lt; 50</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 font-bold block mb-1">6. Criticality Bound</span>
            <span className="text-rose-400">No destructive actions</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase">Approved Safe Adaptations</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/80" />
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase">Blocked / Rejected Changes</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{blockedCount}</div>
          </div>
          <ShieldAlert className="w-8 h-8 text-rose-400/80" />
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase">Pending Gate Reviews</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
          </div>
          <Clock className="w-8 h-8 text-amber-400/80" />
        </div>
      </div>

      {/* Baseline Version History for Selected Identity */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#0B0F1A]/95 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Baseline Version History for {selectedIdentityId}
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Current Active Version: v{baselineDetails?.current_version || 1}
          </span>
        </div>

        {baselineHistory.length === 0 ? (
          <div className="p-4 text-slate-500 font-mono text-xs text-center">
            Currently on Baseline Version 1 (Initial Steady State). Run Legitimate Drift in the simulator to produce Version 2.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2 font-semibold">VERSION</th>
                  <th className="pb-2 font-semibold">RESOURCES IN BASELINE</th>
                  <th className="pb-2 font-semibold">ACTIONS</th>
                  <th className="pb-2 font-semibold">AVG RATE</th>
                  <th className="pb-2 font-semibold">CONFIDENCE</th>
                  <th className="pb-2 font-semibold">REASON</th>
                  <th className="pb-2 font-semibold text-right">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {baselineHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 font-bold text-cyan-400">v{h.version}</td>
                    <td className="py-2.5 text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {h.normal_resources?.map((r) => (
                          <span key={r} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-300">{h.normal_actions?.join(', ')}</td>
                    <td className="py-2.5 text-slate-300">{h.average_request_rate.toFixed(1)}/s</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{h.confidence.toFixed(1)}%</td>
                    <td className="py-2.5 text-slate-400 max-w-xs truncate">{h.change_reason}</td>
                    <td className="py-2.5 text-slate-500 text-right">{new Date(h.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Changes Audit List */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Behavioral Evolution Audit Feed ({filteredChanges.length})
        </h3>

        {filteredChanges.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs rounded-2xl border border-slate-800 bg-[#0B0F1A]/80">
            No baseline modifications found matching selected filter.
            <div className="text-slate-600 mt-1">Run "Legitimate Drift" or "Attack" in the simulator to generate proposals.</div>
          </div>
        ) : (
          filteredChanges.map((change) => (
            <BaselineChangeCard
              key={change.id}
              change={change}
              onDecisionMade={onDecisionMade}
            />
          ))
        )}
      </div>
    </div>
  );
};
