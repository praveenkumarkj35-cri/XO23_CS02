import React, { useState } from 'react';
import { Identity, SecurityEvent } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Filter, Activity, Database } from 'lucide-react';
import { TrustStateBadge } from '../components/TrustStateBadge';
import { RiskBadge } from '../components/RiskBadge';

interface Props {
  identities: Identity[];
  events: SecurityEvent[];
}

export const BehavioralAnalyticsPage: React.FC<Props> = ({ identities, events }) => {
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('ALL');

  const filteredEvents = selectedIdentityId === 'ALL'
    ? events
    : events.filter((e) => e.identity_id === selectedIdentityId);

  // Time series of request frequency & risk
  const timelineData = [...filteredEvents]
    .slice(0, 20)
    .reverse()
    .map((e) => ({
      time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rate: e.request_rate,
      risk: e.risk_score,
      trust: Math.max(0, 100 - e.risk_score),
      action: e.action,
      resource: e.resource,
      identity: e.identity_id
    }));

  // Resource access frequency
  const resourceCounts: Record<string, number> = {};
  filteredEvents.forEach((e) => {
    resourceCounts[e.resource] = (resourceCounts[e.resource] || 0) + 1;
  });
  const resourceData = Object.entries(resourceCounts)
    .map(([resource, count]) => ({ resource, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Action distribution
  const actionCounts: Record<string, number> = {};
  filteredEvents.forEach((e) => {
    actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
  });
  const actionData = Object.entries(actionCounts).map(([action, count]) => ({ action, count }));

  const currentIdentity = identities.find(i => i.id === selectedIdentityId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Identity Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            BEHAVIORAL ANALYTICS & VARIANCE ENGINE
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Deep-dive multi-dimensional telemetry, request rate anomalies, and EWMA deviation curves.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedIdentityId}
            onChange={(e) => setSelectedIdentityId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Fleet Aggregate (All NHIs)</option>
            {identities.map((idn) => (
              <option key={idn.id} value={idn.id}>
                {idn.name} ({idn.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentIdentity && (
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div>
            <span className="text-slate-400">Selected: </span>
            <span className="text-white font-bold">{currentIdentity.name}</span>
            <span className="text-slate-500 ml-2">({currentIdentity.id})</span>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge score={currentIdentity.risk_score} size="sm" showLabel />
            <TrustStateBadge state={currentIdentity.current_state} size="sm" />
          </div>
        </div>
      )}

      {/* Chart Row 1: Request Rate vs Risk Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Frequency Over Time */}
        <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Request Frequency Telemetry (req/min)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Rate variance</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Line type="monotone" dataKey="rate" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 3 }} name="Request Rate" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Score vs Trust Score Timeline */}
        <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              Risk vs Trust Score Trajectory
            </h3>
            <span className="text-[11px] font-mono text-slate-400">0 - 100 Scale</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis domain={[0, 100]} stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Line type="monotone" dataKey="risk" stroke="#EF4444" strokeWidth={2} name="Risk Score" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="trust" stroke="#10B981" strokeWidth={2} name="Trust Score" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 2: Resource Access & Action Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Access Frequency */}
        <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Target Resource Access Distribution
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Access counts</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis dataKey="resource" type="category" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Occurrences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Distribution */}
        <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Action Type Frequency
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Actions breakdown</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="action" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Actions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
