import React from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp,
  Server,
  AlertCircle,
  ExternalLink,
  Cpu,
  Radio,
  Lock,
  Flame,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { Identity, SecurityEvent, SecurityAlert } from '../types';
import { StatCard } from '../components/StatCard';
import { SimulationPanel } from '../components/SimulationPanel';
import { LiveEventStream } from '../components/LiveEventStream';
import { TrustStateBadge } from '../components/TrustStateBadge';
import { RiskBadge } from '../components/RiskBadge';
import { AlertCard } from '../components/AlertCard';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface Props {
  identities: Identity[];
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  currentScenario: string;
  stepIndex: number;
  onSelectIdentity: (id: string) => void;
  onDismissAlert?: (id: string) => void;
}

export const CommandCenterPage: React.FC<Props> = ({
  identities,
  events,
  alerts,
  currentScenario,
  stepIndex,
  onSelectIdentity,
  onDismissAlert
}) => {
  const totalNhis = identities.length;
  const normalCount = identities.filter((i) => i.current_state === 'NORMAL').length;
  const driftingCount = identities.filter((i) => i.current_state === 'DRIFTING').length;
  const suspiciousCount = identities.filter((i) => i.current_state === 'SUSPICIOUS').length;
  const highRiskCount = identities.filter((i) => i.current_state === 'HIGH-RISK').length;

  // Chart data from recent events
  const chartData = [...events]
    .slice(0, 20)
    .reverse()
    .map((evt) => ({
      time: new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      risk: evt.risk_score,
      rate: evt.request_rate,
      identity: evt.identity_id
    }));

  // Risky identities sorted
  const sortedByRisk = [...identities].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-cyan-500/30">
      {/* Top Banner & Security Principle */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-950/40 via-[#070D1A] to-slate-950 p-4 sm:p-5 font-mono text-xs shadow-2xl hud-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 glow-cyan">
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm tracking-wide">
                  SOC BEHAVIORAL COMMAND CENTER
                </span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 font-bold">
                  AUTONOMOUS TRUST GATE
                </span>
              </div>
              <div className="text-[11px] text-cyan-300 mt-1">
                "Valid credentials ≠ Trusted behavior" &bull; Protecting Non-Human Identities in Real-Time
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
            <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
              Engine: <strong className="text-cyan-400">EWMA Multi-Window</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
              Surprise Challenge 2: <strong className="text-orange-400">ACTIVE</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
              Audit Gate: <strong className="text-emerald-400">ENFORCING</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Simulator Station */}
      <SimulationPanel
        activeScenario={currentScenario}
        stepIndex={stepIndex}
        targetIdentity="payment-service"
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total NHIs"
          value={totalNhis}
          icon={Server}
          subtitle="Monitored workloads"
          accentColor="cyan"
        />
        <StatCard
          title="Active NHIs"
          value={totalNhis}
          icon={Activity}
          subtitle="All streaming live"
          accentColor="cyan"
        />
        <StatCard
          title="Normal"
          value={normalCount}
          icon={Shield}
          subtitle="Within baseline"
          accentColor="emerald"
        />
        <StatCard
          title="Drifting"
          value={driftingCount}
          icon={Zap}
          subtitle="Evaluating gate"
          accentColor="amber"
        />
        <StatCard
          title="Suspicious"
          value={suspiciousCount}
          icon={AlertTriangle}
          subtitle="Baseline locked"
          accentColor="orange"
        />
        <StatCard
          title="High-Risk"
          value={highRiskCount}
          icon={AlertCircle}
          subtitle="Access revoked"
          accentColor="rose"
        />
      </div>

      {/* Main Charts & Live Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Risk Trend Chart & Risky Identities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Risk Trend Area Chart */}
          <div className="glass-card p-5 md:p-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-black font-mono text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  REAL-TIME BEHAVIORAL RISK SCORE STREAM
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Continuous explainable risk scoring across incoming telemetry events
                </p>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                0-29 Normal | 30-54 Drift | 55-74 Suspicious | 75+ High-Risk
              </span>
            </div>

            <div className="h-64 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                  Collecting live telemetry data points from event stream...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }} />
                    <YAxis domain={[0, 100]} stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }} />
                    
                    <ReferenceLine y={29} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={54} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={74} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0B101D',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
                      }}
                      itemStyle={{ color: '#38BDF8' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      stroke="#06B6D4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#riskGradient)"
                      name="Risk Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Risky Identities Table */}
          <div className="glass-card p-5 md:p-6 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <h3 className="text-sm font-black font-mono text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                NON-HUMAN IDENTITIES FLEET STATUS
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Sorted by behavioral risk
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-slate-400 uppercase text-[10px] border-b border-slate-800 bg-slate-950/40">
                  <tr>
                    <th className="py-2.5 px-3">Identity</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Trust State</th>
                    <th className="py-2.5 px-3">Trust Score</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedByRisk.map((idn) => (
                    <tr
                      key={idn.id}
                      onClick={() => onSelectIdentity(idn.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3 font-bold text-cyan-300 group-hover:text-cyan-200">
                        {idn.name}
                        <div className="text-[10px] text-slate-500 font-normal">{idn.id}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 capitalize">
                        {idn.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3">
                        <TrustStateBadge state={idn.current_state} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">
                        {idn.trust_score.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3">
                        <RiskBadge score={idn.risk_score} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-cyan-400">
                        {idn.baseline_confidence.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-xs text-cyan-400 group-hover:underline flex items-center justify-end gap-1">
                          View <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Live Event Stream & Recent Alerts */}
        <div className="space-y-6">
          {/* Live Event Stream */}
          <div className="h-[440px]">
            <LiveEventStream events={events} maxItems={8} />
          </div>

          {/* Recent Security Alerts */}
          <div className="glass-card p-5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <h3 className="text-sm font-black font-mono text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                ACTIVE SOC ALERTS ({alerts.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Autonomous Gate</span>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  No active security alerts. Fleet operating within baseline.
                </div>
              ) : (
                alerts.slice(0, 5).map((alt) => (
                  <AlertCard key={alt.id} alert={alt} onDismiss={onDismissAlert} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenterPage;
