import React, { useState } from 'react';
import { SecurityEvent } from '../types';
import { TrustStateBadge } from './TrustStateBadge';
import { RiskBadge } from './RiskBadge';
import { Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, Clock, Shield } from 'lucide-react';

interface Props {
  events: SecurityEvent[];
}

export const EventTable: React.FC<Props> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.identity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.explanation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesState = stateFilter === 'ALL' || evt.trust_state === stateFilter;
    return matchesSearch && matchesState;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="glass-card border border-slate-800 overflow-hidden bg-[#0B0F1A]/90">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search identity, action, resource, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All States ({events.length})</option>
            <option value="NORMAL">Normal</option>
            <option value="DRIFTING">Drifting</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="HIGH-RISK">High-Risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Identity</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Resource</th>
              <th className="py-3 px-4">Rate</th>
              <th className="py-3 px-4">Risk</th>
              <th className="py-3 px-4">State</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No matching telemetry events found.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const isExpanded = expandedId === evt.id;
                return (
                  <React.Fragment key={evt.id}>
                    <tr
                      onClick={() => toggleExpand(evt.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-cyan-400 whitespace-nowrap">
                        {evt.identity_id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-bold">
                          {evt.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 whitespace-nowrap">
                        {evt.resource}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {evt.request_rate} /min
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <RiskBadge score={evt.risk_score} size="sm" />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <TrustStateBadge state={evt.trust_state} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-slate-400 hover:text-cyan-400 p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-900/60">
                        <td colSpan={8} className="p-4">
                          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3 font-mono">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="text-xs text-slate-400 font-bold">
                                Behavioral Anomaly Breakdown
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Source: {evt.source} | Sensitivity: {evt.sensitivity.toUpperCase()}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 font-sans">
                              {evt.explanation}
                            </p>

                            {evt.factors && evt.factors.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {evt.factors.map((f, i) => (
                                  <div
                                    key={i}
                                    className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                                  >
                                    <span className="text-slate-300">{f.reason}</span>
                                    <span className="text-rose-400 font-bold ml-2">+{f.score}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
