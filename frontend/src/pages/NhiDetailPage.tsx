import React, { useState, useEffect } from 'react';
import { Identity, SecurityEvent, SecurityAlert, BaselineChange } from '../types';
import { TrustStateBadge } from '../components/TrustStateBadge';
import { RiskBadge } from '../components/RiskBadge';
import { TrustGauge } from '../components/TrustGauge';
import { BaselineChangeCard } from '../components/BaselineChangeCard';
import { AlertCard } from '../components/AlertCard';
import {
  Shield,
  ArrowLeft,
  Clock,
  Database,
  Activity,
  GitBranch,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';

interface Props {
  identityId: string;
  identities: Identity[];
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  baselineChanges: BaselineChange[];
  onBack: () => void;
}

export const NhiDetailPage: React.FC<Props> = ({
  identityId,
  identities,
  events,
  alerts,
  baselineChanges,
  onBack
}) => {
  const identity = identities.find((i) => i.id === identityId) || identities[0];

  if (!identity) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono">
        Identity not found.
        <button onClick={onBack} className="block mx-auto mt-4 text-cyan-400 underline">
          Return to profiles
        </button>
      </div>
    );
  }

  const profile = identity.profile;
  const identityEvents = events.filter((e) => e.identity_id === identity.id);
  const identityAlerts = alerts.filter((a) => a.identity_id === identity.id);
  const identityChanges = baselineChanges.filter((c) => c.identity_id === identity.id);
  const latestEvent = identityEvents[0];

  // Action distribution data
  const actionCounts: Record<string, number> = {};
  identityEvents.forEach((e) => {
    actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
  });
  const actionData = Object.entries(actionCounts).map(([action, count]) => ({
    action,
    count
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold font-mono text-white tracking-tight">
                {identity.name}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {identity.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Type: <span className="text-slate-200 capitalize">{identity.type}</span> • Owner: <span className="text-slate-200">{identity.owner}</span> • Env: <span className="text-slate-200 capitalize">{identity.environment}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge score={identity.risk_score} size="md" showLabel />
          <TrustStateBadge state={identity.current_state} size="md" />
        </div>
      </div>

      {/* Trust State Explanation Banner */}
      <div className="glass-card p-5 border border-cyan-500/30 bg-[#0B0F1A]/95">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-white">
              Current Trust State Diagnosis: {identity.current_state}
            </h3>
            <p className="text-xs text-slate-300 mt-1 font-sans">
              {latestEvent?.explanation || 
                `Identity behavior adheres to verified baseline bounds. Risk score is ${identity.risk_score}/100 with baseline model confidence of ${identity.baseline_confidence}%.`}
            </p>
            {identity.current_state === 'HIGH-RISK' && (
              <div className="mt-2 text-xs font-mono text-rose-400 flex items-center gap-2">
                <span>🛑 ADAPTIVE TRUST GATE: All baseline updates are strictly blocked. Active containment recommended.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Grid: Trust Gauge + Baseline Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trust Gauge */}
        <div className="glass-card p-5 border border-slate-800 flex flex-col items-center justify-center bg-[#0B0F1A]/90">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            Behavioral Trust Score
          </h4>
          <TrustGauge trustScore={identity.trust_score} riskScore={identity.risk_score} size={180} />
          <div className="text-center mt-3 text-xs font-mono text-slate-400">
            Model Confidence: <strong className="text-cyan-400">{identity.baseline_confidence}%</strong>
          </div>
        </div>

        {/* Established Behavioral Baseline Details */}
        <div className="lg:col-span-2 glass-card p-5 border border-slate-800 space-y-4 bg-[#0B0F1A]/90">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
              <Database className="w-4 h-4" />
              Verified Behavioral Baseline (v{profile?.version || 1})
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              Updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Resources */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-semibold">Approved Resources:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile?.normal_resources.map((res, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {res}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-semibold">Allowed Normal Actions:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile?.normal_actions.map((act, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-bold">
                    {act}
                  </span>
                ))}
              </div>
            </div>

            {/* Rate & Window */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-semibold">Expected Request Rate:</span>
              <div className="text-sm font-bold text-white mt-1">
                {profile?.average_request_rate} <span className="text-slate-400 text-xs font-normal">req/min (±{profile?.std_request_rate})</span>
              </div>
            </div>

            {/* Normal Operating Hours */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-semibold">Normal Operating Window:</span>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {profile ? `${String(profile.normal_hours_start).padStart(2, '0')}:00 – ${String(profile.normal_hours_end).padStart(2, '0')}:00 UTC` : '24/7'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Distribution & Recent Anomaly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Distribution Chart */}
        <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-4">
            Recent Telemetric Action Distribution
          </h4>
          <div className="h-48 w-full">
            {actionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No recent actions recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="action" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Alerts on this identity */}
        <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90 space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
            Identity Security Alerts ({identityAlerts.length})
          </h4>
          <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
            {identityAlerts.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs font-mono">
                No active security alerts for this identity.
              </div>
            ) : (
              identityAlerts.slice(0, 3).map((alt) => (
                <AlertCard key={alt.id} alert={alt} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Proposed / Historical Baseline Changes for this Identity */}
      <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90 space-y-4">
        <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Adaptive Trust Gate Modifications Log ({identityChanges.length})
        </h4>

        {identityChanges.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs font-mono">
            No baseline modifications proposed or recorded for this workload.
          </div>
        ) : (
          <div className="space-y-3">
            {identityChanges.slice(0, 4).map((change) => (
              <BaselineChangeCard key={change.id} change={change} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
