import React, { useState } from 'react';
import { SecurityEvent } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { TrustStateBadge } from '../components/TrustStateBadge';
import { AlertTriangle, ShieldCheck, CheckCircle2, ShieldAlert, Filter, Search, Terminal } from 'lucide-react';

interface Props {
  events: SecurityEvent[];
}

export const RiskAnalysisPage: React.FC<Props> = ({ events }) => {
  const [filterState, setFilterState] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredEvents = events.filter((e) => {
    const matchState = filterState === 'ALL' || e.trust_state === filterState;
    const matchSearch =
      e.identity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.resource.toLowerCase().includes(searchTerm.toLowerCase());
    return matchState && matchSearch;
  });

  const getRecommendation = (state: string, score: number) => {
    if (score >= 75 || state === 'HIGH-RISK') {
      return {
        action: 'BLOCK BASELINE UPDATE • QUARANTINE IDENTITY',
        details: 'Immediately isolate service account tokens, trigger SIEM incident, and reject all pending baseline mutations.',
        color: 'text-rose-400 border-rose-500/40 bg-rose-950/20'
      };
    } else if (score >= 55 || state === 'SUSPICIOUS') {
      return {
        action: 'HOLD BASELINE MUTATION • ELEVATE AUDIT LOGGING',
        details: 'Lock baseline update queue. Require manual SecOps approval before admitting novel resource associations.',
        color: 'text-orange-400 border-orange-500/40 bg-orange-950/20'
      };
    } else if (score >= 30 || state === 'DRIFTING') {
      return {
        action: 'EVALUATE ADAPTIVE TRUST GATE • TRACK STABILITY',
        details: 'Permit temporary workload progression while monitoring repetition, rate stability, and context legitimacy.',
        color: 'text-amber-400 border-amber-500/40 bg-amber-950/20'
      };
    } else {
      return {
        action: 'CONTINUE AUTONOMOUS MONITORING',
        details: 'Activity aligns strictly with historical baseline profile. Increment confidence metrics.',
        color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20'
      };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            TRANSPARENT RISK SCORE DECOMPOSITION
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Explainable 0–100 risk scoring with factor weights, statistical anomalies, and prescriptive SecOps recommendations.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All States</option>
            <option value="HIGH-RISK">High-Risk Only</option>
            <option value="SUSPICIOUS">Suspicious Only</option>
            <option value="DRIFTING">Drifting Only</option>
            <option value="NORMAL">Normal Only</option>
          </select>
        </div>
      </div>

      {/* Risk Scoring Methodology Card */}
      <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90">
        <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-2">
          Explainable Scoring Weights Formula
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Resource Novelty</span>
            <span className="text-white font-bold">+25 pts max</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Action Novelty</span>
            <span className="text-white font-bold">+25 pts max</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Frequency Spike</span>
            <span className="text-white font-bold">+20 pts max</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Sequence Anomaly</span>
            <span className="text-white font-bold">+15 pts max</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Sensitive Resource</span>
            <span className="text-white font-bold">+18 pts max</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Time of Day</span>
            <span className="text-white font-bold">+10 pts max</span>
          </div>
        </div>
      </div>

      {/* Events Risk Cards */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500 font-mono text-xs border border-slate-800">
            No events found matching selected filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const rec = getRecommendation(evt.trust_state, evt.risk_score);

            return (
              <div key={evt.id} className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold font-mono text-white">
                      {evt.identity_id}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-bold">
                      {evt.action}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {evt.resource}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <RiskBadge score={evt.risk_score} size="md" showLabel />
                    <TrustStateBadge state={evt.trust_state} size="sm" />
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="text-xs text-slate-300 font-sans leading-relaxed">
                  <strong className="text-slate-400 font-mono">Detection Rationale: </strong>
                  {evt.explanation}
                </div>

                {/* Factors List */}
                {evt.factors && evt.factors.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {evt.factors.map((f, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-300">{f.reason}</span>
                        <span className="text-rose-400 font-bold ml-2">+{f.score}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prescriptive Recommendation */}
                <div className={`p-3 rounded-lg border text-xs font-mono ${rec.color}`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>RECOMMENDED SOC ACTION: {rec.action}</span>
                  </div>
                  <div className="text-slate-300 mt-1 font-sans text-[11px]">
                    {rec.details}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
