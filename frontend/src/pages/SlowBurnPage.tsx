import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, Legend, ReferenceLine
} from 'recharts';
import {
  Flame, Shield, AlertTriangle, CheckCircle2, XCircle, Play, Pause,
  RotateCcw, ChevronRight, Activity, Eye, Database, Clock, Zap,
  TrendingUp, Lock, Unlock, SkipForward, FlaskConical, AlertOctagon,
  Layers, ArrowRight, ShieldCheck, Cpu, Radio, Sparkles
} from 'lucide-react';
import {
  fetchSlowBurnStatus,
  startSlowBurnSimulation,
  stopSlowBurnSimulation,
  resetSlowBurnSimulation,
  executeSlowBurnStep,
  runSlowBurnEvaluation
} from '../services/api';
import { RiskMeter } from '../components/RiskMeter';

// ============================================================
// TYPES
// ============================================================
interface SlowBurnStatus {
  is_running: boolean;
  current_window: number;
  total_windows: number;
  target_identity: string;
  monitoring_status: string;
  current_trust_state: string;
  instant_risk: number;
  cumulative_risk: number;
  cumulative_evidence_score: number;
  baseline_decision: string;
  trusted_baseline_status: string;
  explanation: string;
  evidence_breakdown: Record<string, number>;
  progression: ProgressionPoint[];
  observations: ObservationRecord[];
  recent_events: RecentEvent[];
  canonical_progression: CanonicalWindow[];
}

interface ProgressionPoint {
  window: number;
  label: string;
  instant_risk: number;
  cumulative_risk: number;
  evidence_score: number;
  trust_state: string;
  deviation_type: string;
  action: string;
  resource: string;
  decision: string;
  timestamp?: string;
}

interface ObservationRecord {
  id: string;
  identity_id: string;
  window_number: number;
  timestamp: string;
  instant_risk: number;
  cumulative_risk: number;
  evidence_score: number;
  trust_state: string;
  deviation_type: string;
  action: string;
  resource: string;
  explanation: string;
  decision: string;
  evidence_breakdown: Record<string, number>;
}

interface RecentEvent {
  id: string;
  action: string;
  resource: string;
  timestamp: string;
  request_rate: number;
  risk_score: number;
  trust_state: string;
}

interface CanonicalWindow {
  window: number;
  label: string;
  trust_state: string;
  baseline_decision: string;
  description: string;
  cumulative_risk_band: number[];
}

interface EvalResult {
  scenario: string;
  expected_state: string;
  actual_state: string;
  expected_baseline_decision: string;
  actual_baseline_decision: string;
  risk_score: number;
  passed: boolean;
  explanation: string;
}

// ============================================================
// HELPERS
// ============================================================
const TRUST_COLORS: Record<string, string> = {
  NORMAL: '#10b981',
  DRIFTING: '#f59e0b',
  SUSPICIOUS: '#f97316',
  'HIGH-RISK': '#ef4444',
};

const DECISION_COLORS: Record<string, string> = {
  NO_CHANGE: '#64748b',
  APPROVED: '#10b981',
  PENDING: '#f59e0b',
  BLOCKED: '#ef4444',
  REJECTED: '#ef4444',
};

function trustColor(state: string) { return TRUST_COLORS[state] ?? '#64748b'; }
function decisionColor(dec: string) { return DECISION_COLORS[dec] ?? '#64748b'; }

function TrustBadge({ state, size = 'sm' }: { state: string; size?: 'sm' | 'md' | 'lg' }) {
  const norm = (state || 'NORMAL').toUpperCase().replace('_', '-');
  const colors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    NORMAL: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-500/40', glow: 'glow-green' },
    DRIFTING: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-500/40', glow: 'glow-yellow' },
    SUSPICIOUS: { bg: 'bg-orange-950/40', text: 'text-orange-300', border: 'border-orange-500/50', glow: 'glow-orange' },
    'HIGH-RISK': { bg: 'bg-rose-950/50', text: 'text-rose-300', border: 'border-rose-500/50', glow: 'glow-red' },
    UNKNOWN: { bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-700', glow: '' }
  };
  const conf = colors[norm] ?? colors.UNKNOWN;
  const Icon = norm === 'NORMAL' ? CheckCircle2 : norm === 'HIGH-RISK' ? AlertOctagon : AlertTriangle;
  const sizeClass = size === 'lg' ? 'px-3.5 py-1.5 text-sm gap-2' : size === 'md' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[11px] gap-1';

  return (
    <span className={`inline-flex items-center rounded-lg font-bold border font-mono tracking-wider ${conf.bg} ${conf.text} ${conf.border} ${conf.glow} ${sizeClass}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      <span>{norm}</span>
    </span>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const norm = (decision || 'NO_CHANGE').toUpperCase();
  const colors: Record<string, string> = {
    NO_CHANGE: 'bg-slate-900/90 text-slate-400 border-slate-700',
    APPROVED: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 glow-green',
    PENDING: 'bg-amber-950/50 text-amber-300 border-amber-500/40 glow-yellow',
    BLOCKED: 'bg-rose-950/50 text-rose-300 border-rose-500/50 glow-red',
    REJECTED: 'bg-rose-950/50 text-rose-300 border-rose-500/50 glow-red',
  };
  const cls = colors[norm] ?? colors.NO_CHANGE;
  const Icon = norm === 'BLOCKED' || norm === 'REJECTED' ? Lock : norm === 'APPROVED' ? Unlock : norm === 'PENDING' ? Clock : Shield;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border font-mono tracking-wide ${cls}`}>
      <Icon className="w-3 h-3" />
      {norm.replace('_', ' ')}
    </span>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export function SlowBurnPage({ wsPayload }: { wsPayload?: any }) {
  const [status, setStatus] = useState<SlowBurnStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [simRunning, setSimRunning] = useState(false);
  const [evalRunning, setEvalRunning] = useState(false);
  const [evalResults, setEvalResults] = useState<EvalResult[] | null>(null);
  const [evalMeta, setEvalMeta] = useState<any>(null);
  const [activeIdentity] = useState('payment-service');
  const [manualWindow, setManualWindow] = useState(0);
  const [stepLoading, setStepLoading] = useState(false);
  const [legitimateMode, setLegitimateMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'windows' | 'evidence' | 'comparison' | 'evaluation'>('dashboard');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchSlowBurnStatus(activeIdentity);
      setStatus(data);
      setSimRunning(data.is_running);
    } catch (e) {
      console.error('Slow-burn status fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [activeIdentity]);

  useEffect(() => {
    loadStatus();
    pollRef.current = setInterval(loadStatus, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadStatus]);

  // React to SLOW_BURN_UPDATE WebSocket events
  useEffect(() => {
    if (wsPayload?.type === 'SLOW_BURN_UPDATE') {
      loadStatus();
    }
  }, [wsPayload, loadStatus]);

  const handleStart = async () => {
    await startSlowBurnSimulation(activeIdentity, 2200);
    setSimRunning(true);
    await loadStatus();
  };

  const handleStop = async () => {
    await stopSlowBurnSimulation();
    setSimRunning(false);
    await loadStatus();
  };

  const handleReset = async () => {
    await resetSlowBurnSimulation();
    setSimRunning(false);
    setEvalResults(null);
    setEvalMeta(null);
    setManualWindow(0);
    await loadStatus();
  };

  const handleStep = async (w: number) => {
    setStepLoading(true);
    try {
      await executeSlowBurnStep(w, legitimateMode);
      setManualWindow(Math.min(5, w + 1));
      await loadStatus();
    } finally {
      setStepLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setEvalRunning(true);
    try {
      const res = await runSlowBurnEvaluation();
      setEvalResults(res.results);
      setEvalMeta({
        run_id: res.run_id,
        pass_rate: res.pass_rate_pct,
        sc2_compliant: res.sc2_compliant,
        passed: res.passed_count,
        total: res.total_scenarios,
        baseline_protected: res.baseline_protected,
      });
      await loadStatus();
      setActiveTab('evaluation');
    } finally {
      setEvalRunning(false);
    }
  };

  // Chart data — combine canonical model with actual observations
  const chartProgression = React.useMemo(() => {
    if (!status) return [];
    const canon = status.canonical_progression || [];
    const actual = status.progression || [];
    return canon.map((c: CanonicalWindow) => {
      const obs = actual.find(p => p.window === c.window);
      return {
        label: c.label,
        window: c.window,
        instant_risk: obs?.instant_risk ?? null,
        cumulative_risk: obs?.cumulative_risk ?? null,
        evidence_score: obs?.evidence_score ?? null,
        canon_risk_lo: c.cumulative_risk_band?.[0] ?? null,
        canon_risk_hi: c.cumulative_risk_band?.[1] ?? null,
        trust_state: obs?.trust_state ?? c.trust_state,
        decision: obs?.decision ?? c.baseline_decision,
      };
    });
  }, [status]);

  // Radar chart data from evidence breakdown
  const radarData = React.useMemo(() => {
    if (!status?.evidence_breakdown) return [];
    const bd = status.evidence_breakdown;
    return [
      { subject: 'Resource Novelty', value: Math.min(100, bd.resource_novelty_score ?? 0), fullMark: 100 },
      { subject: 'Action Novelty', value: Math.min(100, bd.action_novelty_score ?? 0), fullMark: 100 },
      { subject: 'Frequency Drift', value: Math.min(100, bd.frequency_drift_score ?? 0), fullMark: 100 },
      { subject: 'Sequence Dev.', value: Math.min(100, bd.sequence_deviation_score ?? 0), fullMark: 100 },
      { subject: 'Temporal Dev.', value: Math.min(100, bd.temporal_deviation_score ?? 0), fullMark: 100 },
      { subject: 'Sensitivity', value: Math.min(100, bd.sensitivity_score ?? 0), fullMark: 100 },
      { subject: 'Persistence', value: Math.min(100, bd.persistence_score ?? 0), fullMark: 100 },
    ];
  }, [status]);

  const cr = status?.cumulative_risk ?? 10;
  const ir = status?.instant_risk ?? 12;
  const es = status?.cumulative_evidence_score ?? 0;
  const ts = status?.current_trust_state ?? 'NORMAL';
  const bd = status?.baseline_decision ?? 'NO_CHANGE';
  const tbs = status?.trusted_baseline_status ?? 'PROTECTED';
  const cw = status?.current_window ?? 0;

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-orange-500/30">
      {/* ─── TOP HERO BANNER: SURPRISE CHALLENGE 2 SHOWCASE ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-[#0B0F1C] to-slate-950 p-5 md:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black font-mono tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/40 glow-orange flex items-center gap-1.5 uppercase">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                Surprise Challenge 2
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                MULTI-WINDOW EWMA TELEMETRY
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-purple-950/40 text-purple-300 border border-purple-500/30">
                INVARIANT PRESERVATION
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Slow-Burn Behavioral Deviation Defense
            </h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono">
              <div className="text-orange-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>"DON'T JUDGE A SINGLE EVENT. ACCUMULATE THE EVIDENCE."</span>
              </div>
              <div className="text-slate-400 italic">
                Single Event Risk ≠ Final Trust Decision
              </div>
            </div>
          </div>

          {/* Master Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!simRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-black font-mono shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:brightness-110 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>AUTO-RUN W0→W5</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black font-mono glow-yellow hover:bg-amber-500/30 active:scale-95 transition-all"
              >
                <Pause className="w-4 h-4" />
                <span>HALT SIMULATION</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-bold font-mono hover:bg-slate-800 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleEvaluate}
              disabled={evalRunning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-black font-mono glow-cyan hover:bg-cyan-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {evalRunning ? <Activity className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              <span>RUN SC2 EVAL</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 7 KEY METRICS HUD RIBBON ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 font-mono">
        {/* Metric 1: Window Progress */}
        <div className="glass-card p-3.5 relative overflow-hidden border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between mb-1.5">
            <span>Window Stage</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          </div>
          <div className="text-xl font-black text-white">
            W{cw} <span className="text-xs text-slate-500 font-normal">/ W5</span>
          </div>
          <div className="mt-1.5 text-[10px] text-cyan-400 truncate">
            {cw === 0 ? 'Baseline (Steady)' : cw <= 2 ? 'Subtle Drift' : cw <= 4 ? 'Escalation' : 'High-Risk Breach'}
          </div>
        </div>

        {/* Metric 2: Target Identity */}
        <div className="glass-card p-3.5 border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 flex items-center gap-1">
            <Shield className="w-3 h-3 text-cyan-400" /> Target NHI
          </div>
          <div className="text-sm font-black text-white truncate">
            payment-service
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            NHI Token #9281
          </div>
        </div>

        {/* Metric 3: Current Trust State */}
        <div className="glass-card p-3.5 border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 flex items-center gap-1">
            <Eye className="w-3 h-3 text-orange-400" /> Trust State
          </div>
          <TrustBadge state={ts} size="sm" />
          <div className="mt-1.5 text-[10px] text-slate-500">
            {ts === 'HIGH-RISK' ? 'Access Blocked' : 'Monitoring Flow'}
          </div>
        </div>

        {/* Metric 4: Instantaneous Risk */}
        <div className="glass-card p-3.5 border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" /> Instant Risk
          </div>
          <div className="text-xl font-black text-cyan-400">
            {ir.toFixed(1)}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Per-Event Score
          </div>
        </div>

        {/* Metric 5: Cumulative Risk */}
        <div className="glass-card p-3.5 border-orange-500/30 bg-orange-950/15">
          <div className="text-[10px] text-orange-400 uppercase font-bold mb-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-orange-400" /> Cumulative Risk
          </div>
          <div className="text-2xl font-black tracking-tight" style={{ color: trustColor(ts) }}>
            {cr.toFixed(1)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            Evidence-Weighted
          </div>
        </div>

        {/* Metric 6: Baseline Status */}
        <div className="glass-card p-3.5 border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 flex items-center gap-1">
            <Database className="w-3 h-3 text-emerald-400" /> Baseline Security
          </div>
          <div className="flex items-center gap-1.5">
            {tbs === 'PROTECTED' ? (
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className={`text-xs font-black ${tbs === 'PROTECTED' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {tbs}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            {tbs === 'PROTECTED' ? 'Zero Poisoning' : 'Compromised'}
          </div>
        </div>

        {/* Metric 7: Baseline Decision */}
        <div className="glass-card p-3.5 border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-purple-400" /> Gate Decision
          </div>
          <DecisionBadge decision={bd} />
          <div className="mt-1 text-[10px] text-slate-500">
            Evolution Control
          </div>
        </div>
      </div>

      {/* ─── LIVE EXPLANATION HUD BANNER ─── */}
      {status?.explanation && (
        <div className={`rounded-xl p-4 border text-xs font-mono flex items-start gap-3 shadow-lg ${
          ts === 'HIGH-RISK' ? 'bg-rose-950/30 border-rose-500/50 text-rose-200 glow-red' :
          ts === 'SUSPICIOUS' ? 'bg-orange-950/30 border-orange-500/50 text-orange-200 glow-orange' :
          ts === 'DRIFTING' ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 glow-yellow' :
          'bg-emerald-950/20 border-emerald-500/30 text-emerald-200 glow-green'
        }`}>
          <div className="p-2 rounded-lg bg-black/40 shrink-0 mt-0.5">
            <Flame className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-75 mb-0.5">
              Behavioral Decision Rationale & Telemetry Analysis:
            </div>
            <div className="text-sm font-semibold leading-relaxed">
              {status.explanation}
            </div>
          </div>
        </div>
      )}

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex flex-wrap gap-1.5 bg-slate-900/80 border border-slate-800/90 rounded-xl p-1.5 font-mono">
        {[
          { id: 'dashboard', label: 'Cumulative Risk Progression', icon: TrendingUp },
          { id: 'windows', label: 'Observation Windows (W0-W5)', icon: Layers },
          { id: 'evidence', label: '8-Dimension Evidence Breakdown', icon: Activity },
          { id: 'comparison', label: 'Legitimate vs Slow-Burn Matrix', icon: ShieldCheck },
          { id: 'evaluation', label: 'SC2 Compliance Verification', icon: FlaskConical, badge: evalMeta ? `${evalMeta.pass_rate}%` : undefined },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/25 to-amber-500/20 text-orange-300 border border-orange-500/50 glow-orange shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: CUMULATIVE RISK PROGRESSION DASHBOARD ─── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Main Chart + Radial Meter Dual Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Progression Chart (3 columns) */}
            <div className="lg:col-span-3 glass-card p-5 md:p-6 border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-base font-black text-white font-mono flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    Multi-Window Evidence Accumulation vs Single-Event Instant Risk
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Notice how Instant Risk stays sub-threshold (~25) while Cumulative Risk correctly accumulates to trigger HIGH-RISK.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-orange-400 font-bold">
                    <span className="w-3 h-1 bg-orange-500 rounded"></span> Cumulative
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <span className="w-3 h-1 bg-cyan-400 rounded"></span> Instant
                  </span>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartProgression} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                    <defs>
                      <linearGradient id="cumRiskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="instRiskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'monospace' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'monospace' }} />
                    
                    {/* Security Threshold Lines */}
                    <ReferenceLine y={25} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'DRIFT (25)', fill: '#eab308', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={50} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'SUSPICIOUS (50)', fill: '#f97316', fontSize: 10, position: 'right' }} />
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'HIGH-RISK (75)', fill: '#ef4444', fontSize: 10, position: 'right' }} />

                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0F1C', border: '1px solid rgba(249,115,22,0.4)', borderRadius: 10, fontSize: 12, fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.8)' }}
                      formatter={(val: any, name: any) => [`${parseFloat(val || 0).toFixed(1)} pts`, String(name)]}
                    />

                    <Area
                      type="monotone"
                      dataKey="cumulative_risk"
                      name="Cumulative Risk"
                      stroke="#f97316"
                      strokeWidth={3}
                      fill="url(#cumRiskGrad)"
                      dot={{ r: 5, fill: '#f97316', stroke: '#ffffff', strokeWidth: 1.5 }}
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="instant_risk"
                      name="Instant Risk"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      fill="url(#instRiskGrad)"
                      dot={{ r: 4, fill: '#06b6d4' }}
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="evidence_score"
                      name="Evidence Score"
                      stroke="#a855f7"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      fill="none"
                      dot={false}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Algorithm: <strong className="text-orange-400">Decay-Weighted Cumulative Evidence (SC2 Invariant)</strong></span>
                <span>Threshold: <strong className="text-rose-400">State Transition at 75.0 pts</strong></span>
              </div>
            </div>

            {/* Radial Risk Meter Card (1 column) */}
            <div className="glass-card p-5 border-slate-800 flex flex-col items-center justify-between text-center">
              <div className="w-full text-left border-b border-slate-800 pb-2">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Active Risk Gauge</span>
                <h4 className="text-sm font-bold text-white font-mono">Weighted Exposure</h4>
              </div>

              <RiskMeter
                score={cr}
                size={170}
                label="CUMULATIVE EXPOSURE"
                sublabel={`Window ${cw} of 5`}
              />

              <div className="w-full mt-2 pt-3 border-t border-slate-800 space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Evidence Score:</span>
                  <span className="font-bold text-purple-400">{es.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Baseline Guard:</span>
                  <span className="font-bold text-emerald-400">Active &amp; Locked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Canonical Window Progress Pipeline (W0 through W5) */}
          <div className="glass-card p-5 md:p-6 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-white font-mono flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-400" />
                  Canonical Multi-Window Behavioral Pipeline (W0 → W5)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sequential behavioral stages observed across time windows during slow-burn compromise execution.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {(status?.canonical_progression ?? []).map((w: CanonicalWindow, idx: number) => {
                const obs = status?.progression?.find(p => p.window === w.window);
                const isActive = cw === w.window;
                const isExecuted = obs !== undefined;

                return (
                  <div
                    key={w.window}
                    className={`rounded-xl border p-3.5 font-mono transition-all relative ${
                      isExecuted
                        ? obs?.trust_state === 'HIGH-RISK'
                          ? 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          : obs?.trust_state === 'SUSPICIOUS'
                          ? 'border-orange-500/60 bg-orange-950/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                          : obs?.trust_state === 'DRIFTING'
                          ? 'border-amber-500/50 bg-amber-950/15'
                          : 'border-emerald-500/40 bg-emerald-950/15'
                        : isActive
                        ? 'border-cyan-500/70 bg-cyan-950/20 animate-pulse'
                        : 'border-slate-800 bg-slate-900/40 opacity-70'
                    }`}
                  >
                    {/* Header: Window Number & State */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-white">
                        {w.label}
                      </span>
                      {obs ? (
                        <TrustBadge state={obs.trust_state} size="sm" />
                      ) : (
                        <span className="text-[10px] text-slate-500 border border-slate-700/80 rounded px-1.5 py-0.5">
                          {w.trust_state}
                        </span>
                      )}
                    </div>

                    {/* Window Description */}
                    <p className="text-[11px] text-slate-300 leading-snug min-h-[38px]">
                      {w.description}
                    </p>

                    {/* Window Result Metrics */}
                    {obs ? (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cum. Risk:</span>
                          <span className="font-bold" style={{ color: trustColor(obs.trust_state) }}>
                            {obs.cumulative_risk.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Decision:</span>
                          <span className="font-bold truncate max-w-[85px]" style={{ color: decisionColor(obs.decision) }}>
                            {obs.decision.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-slate-500">
                        Pending Execution
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Stepping Console */}
          <div className="glass-card p-5 border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <SkipForward className="w-4 h-4 text-orange-400" />
                  Granular Step-by-Step Window Execution
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execute individual observation windows to inspect behavioral delta per stage.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 font-mono">
                {/* Mode Selector */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setLegitimateMode(false)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      !legitimateMode ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 glow-red' : 'text-slate-500'
                    }`}
                  >
                    🔴 Attack Mode
                  </button>
                  <button
                    onClick={() => setLegitimateMode(true)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      legitimateMode ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 glow-green' : 'text-slate-500'
                    }`}
                  >
                    🟢 Legitimate Drift
                  </button>
                </div>

                {/* Step Buttons */}
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((w) => (
                    <button
                      key={w}
                      disabled={stepLoading}
                      onClick={() => handleStep(w)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 ${
                        manualWindow === w
                          ? 'bg-orange-500/25 text-orange-300 border-orange-500/60 glow-orange'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      Step W{w}
                    </button>
                  ))}
                </div>

                {stepLoading && (
                  <span className="text-xs text-orange-400 animate-pulse flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 animate-spin" /> Simulating...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: DETAILED OBSERVATION WINDOWS ─── */}
      {activeTab === 'windows' && (
        <div className="space-y-4 font-mono">
          {(status?.observations ?? []).length === 0 ? (
            <div className="glass-card p-12 text-center border-slate-800">
              <Flame className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No Observation Windows Executed Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Trigger &quot;AUTO-RUN W0→W5&quot; in the header above, or click individual window buttons to see detailed SOC forensic events.
              </p>
              <button
                onClick={handleStart}
                className="mt-4 px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold hover:bg-orange-500/30"
              >
                Launch Simulation Now
              </button>
            </div>
          ) : (
            status?.observations.map((obs: ObservationRecord) => (
              <div
                key={obs.id}
                className={`glass-card p-5 border transition-all ${
                  obs.trust_state === 'HIGH-RISK' ? 'border-rose-500/40 bg-rose-950/15' :
                  obs.trust_state === 'SUSPICIOUS' ? 'border-orange-500/40 bg-orange-950/15' :
                  obs.trust_state === 'DRIFTING' ? 'border-amber-500/40 bg-amber-950/15' :
                  'border-emerald-500/30 bg-emerald-950/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-orange-400">
                      W{obs.window_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">Window {obs.window_number} Observation</span>
                        <TrustBadge state={obs.trust_state} size="sm" />
                        <DecisionBadge decision={obs.decision} />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(obs.timestamp).toLocaleTimeString()} &bull; Action: <code className="text-cyan-300">{obs.action}</code> → Resource: <code className="text-amber-300">{obs.resource}</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase">Instant Risk</div>
                      <div className="font-black text-cyan-400">{obs.instant_risk.toFixed(1)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase">Cumulative Risk</div>
                      <div className="font-black" style={{ color: trustColor(obs.trust_state) }}>
                        {obs.cumulative_risk.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase">Evidence Score</div>
                      <div className="font-black text-purple-400">{obs.evidence_score.toFixed(1)}</div>
                    </div>
                  </div>
                </div>

                {obs.explanation && (
                  <div className="mt-3 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800/70 leading-relaxed">
                    <strong className="text-orange-400">Forensic Analysis:</strong> {obs.explanation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── TAB 3: 8-DIMENSION EVIDENCE BREAKDOWN ─── */}
      {activeTab === 'evidence' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
          {/* Radar Dimension Chart */}
          <div className="glass-card p-6 border-slate-800">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Behavioral Dimension Radar
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Visualizes 7 distinct anomaly vectors tracked across temporal windows.
            </p>

            {radarData.every(d => d.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs">
                <Flame className="w-8 h-8 text-slate-700 mb-2" />
                No behavioral evidence accumulated yet.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }} />
                    <Radar
                      name="Evidence Weight"
                      dataKey="value"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bar Metrics Breakdown */}
          <div className="glass-card p-6 border-slate-800">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Evidence Dimension Scores (0–100)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Normalized score contributions feeding the weighted cumulative risk engine.
            </p>

            <div className="space-y-3.5">
              {radarData.map((d) => (
                <div key={d.subject}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">{d.subject}</span>
                    <span className="font-bold font-mono" style={{ color: d.value > 70 ? '#ef4444' : d.value > 40 ? '#f97316' : '#10b981' }}>
                      {d.value.toFixed(1)} / 100
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(2, d.value)}%`,
                        background: d.value > 70 ? 'linear-gradient(90deg, #f97316, #ef4444)' : d.value > 40 ? 'linear-gradient(90deg, #f59e0b, #f97316)' : 'linear-gradient(90deg, #06b6d4, #10b981)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Raw Counts Table */}
            {status?.evidence_breakdown && Object.keys(status.evidence_breakdown).length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'evidence_count', label: 'Total Events Observed' },
                  { key: 'repeated_deviation_count', label: 'Repeated Deviations' },
                  { key: 'resource_novelty_count', label: 'Novel Resources' },
                  { key: 'action_novelty_count', label: 'Novel Actions' },
                  { key: 'frequency_deviation_count', label: 'Frequency Shifts' },
                  { key: 'sensitivity_events', label: 'Sensitive Resource Touches' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 text-[11px] truncate">{label}:</span>
                    <span className="font-bold text-cyan-300 ml-1">{status.evidence_breakdown[key] ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: LEGITIMATE VS SLOW-BURN COMPARISON MATRIX ─── */}
      {activeTab === 'comparison' && (
        <div className="glass-card p-6 border-slate-800 font-sans">
          <div className="max-w-3xl mb-6">
            <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 tracking-wider">
              CYBERSECURITY ARCHITECTURAL SHOWCASE
            </span>
            <h3 className="text-xl font-black text-white font-mono mt-1">
              Why Single-Event Thresholds Fail Against Slow-Burn Attacks
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Conventional SOC alerts trigger on sudden spikes. Slow-Burn attackers intentionally keep individual actions below alarm thresholds. TrustNexus AI differentiates legitimate workload evolution from stealth compromise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Legitimate Drift */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-emerald-500/20 pb-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white font-mono uppercase">
                    Legitimate Workload Evolution
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Adaptive Gate: APPROVED (v2 Baseline)
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Predictable Peer Traffic:</strong> Ingress originating from legitimate microservices (e.g. order-service).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Low Entropy Actions:</strong> Standard query patterns on newly provisioned secondary tables.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Bounded Frequency:</strong> Velocity scales smoothly and remains within scheduled cadence.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Trust Decision:</strong> Preserves baseline stability; approves new resources via Adaptive Gate.</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Slow-Burn Deviation Attack */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-3">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white font-mono uppercase">
                    Slow-Burn Compromise (SC2)
                  </h4>
                  <span className="text-[11px] text-rose-400 font-mono">
                    Adaptive Gate: BLOCKED &amp; PROTECTED
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 font-mono">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span><strong>Sub-Threshold Probing:</strong> Per-event risk stays low (~20 pts) to bypass static WAF/SIEM rules.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span><strong>Expanding Novelty:</strong> Adversary introduces novel resources across disparate observation windows.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span><strong>Crown Jewel Probing:</strong> Eventually pivots toward high-value vaults (PII, DB credentials).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span>
                  <span><strong>Trust Decision:</strong> Cumulative evidence breaches 75 pts &rarr; <strong>HIGH-RISK state triggered</strong>, baseline locked.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: SC2 COMPLIANCE VERIFICATION ─── */}
      {activeTab === 'evaluation' && (
        <div className="space-y-5 font-mono">
          {!evalResults ? (
            <div className="glass-card p-10 text-center border-slate-800">
              <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Surprise Challenge 2 Evaluation Suite</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                Execute automated test scenarios validating the 4 core SC2 behavioral invariants:
                persistence thresholding, baseline preservation, legitimate approval, and rapid hijack defense.
              </p>
              <button
                onClick={handleEvaluate}
                disabled={evalRunning}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-black mx-auto glow-cyan hover:bg-cyan-500/30 transition-all disabled:opacity-50"
              >
                {evalRunning ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Full SC2 Evaluation Suite
              </button>
            </div>
          ) : (
            <>
              {/* Eval Summary Banner */}
              {evalMeta && (
                <div className={`rounded-xl border p-5 ${
                  evalMeta.sc2_compliant
                    ? 'border-emerald-500/40 bg-emerald-950/20 glow-green'
                    : 'border-rose-500/40 bg-rose-950/20 glow-red'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {evalMeta.sc2_compliant ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-lg font-black text-white flex items-center gap-2">
                          <span>SC2 VERIFICATION:</span>
                          <span className={evalMeta.sc2_compliant ? 'text-emerald-400' : 'text-rose-400'}>
                            {evalMeta.sc2_compliant ? '100% COMPLIANT ✓' : 'FAILED ✗'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Run Reference: <code className="text-cyan-300">{evalMeta.run_id}</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-3xl font-black" style={{ color: evalMeta.pass_rate >= 75 ? '#10b981' : '#ef4444' }}>
                          {evalMeta.pass_rate}%
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          {evalMeta.passed} / {evalMeta.total} Scenarios Passed
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>Trusted Baseline Status: {evalMeta.baseline_protected ? 'PROTECTED & UNPOISONED' : 'COMPROMISED'}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      Surprise Challenge 2 Benchmark Suite
                    </span>
                  </div>
                </div>
              )}

              {/* Verification Results Table */}
              <div className="glass-card overflow-hidden border-slate-800">
                <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    SC2 Scenario Invariant Results
                  </h4>
                  <button
                    onClick={handleEvaluate}
                    disabled={evalRunning}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Re-run Suite
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] text-slate-400 uppercase">
                        <th className="text-left px-4 py-2.5">Scenario Tested</th>
                        <th className="text-center px-3 py-2.5">Expected</th>
                        <th className="text-center px-3 py-2.5">Actual</th>
                        <th className="text-center px-3 py-2.5">Final Risk</th>
                        <th className="text-center px-3 py-2.5">Gate Action</th>
                        <th className="text-center px-3 py-2.5">Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evalResults.map((r, i) => (
                        <tr key={i} className={`border-b border-slate-800/60 ${r.passed ? 'hover:bg-slate-800/30' : 'bg-rose-950/15'}`}>
                          <td className="px-4 py-3 text-slate-300 max-w-sm">
                            <div className="font-bold text-white">{r.scenario}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{r.explanation}</div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <TrustBadge state={r.expected_state} size="sm" />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <TrustBadge state={r.actual_state} size="sm" />
                          </td>
                          <td className="px-3 py-3 text-center font-black" style={{ color: trustColor(r.actual_state) }}>
                            {r.risk_score.toFixed(1)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <DecisionBadge decision={r.actual_baseline_decision} />
                          </td>
                          <td className="px-3 py-3 text-center">
                            {r.passed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                                <XCircle className="w-3.5 h-3.5" /> FAIL
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SlowBurnPage;
