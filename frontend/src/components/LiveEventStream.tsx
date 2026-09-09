import React, { useState } from 'react';
import { SecurityEvent } from '../types';
import { TrustStateBadge } from './TrustStateBadge';
import { RiskBadge } from './RiskBadge';
import { Activity, Clock, Server, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  events: SecurityEvent[];
  onSelectEvent?: (event: SecurityEvent) => void;
  maxItems?: number;
}

export const LiveEventStream: React.FC<Props> = ({ events, onSelectEvent, maxItems = 10 }) => {
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const displayEvents = events.slice(0, maxItems);

  const handleRowClick = (evt: SecurityEvent) => {
    setSelectedEvent(evt);
    if (onSelectEvent) onSelectEvent(evt);
  };

  return (
    <div className="glass-card border border-slate-800 flex flex-col h-full bg-[#0B0F1A]/90">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono tracking-wide">LIVE EVENT STREAM</h3>
            <p className="text-[11px] text-slate-400">Continuous non-human identity telemetric audit stream</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE WS
          </span>
        </div>
      </div>

      {/* Events List */}
      <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1 max-h-[460px]">
        {displayEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
            Awaiting streaming events from WebSocket...
          </div>
        ) : (
          displayEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => handleRowClick(evt)}
              className="p-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">
                  <TrustStateBadge state={evt.trust_state} size="sm" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-cyan-300 hover:underline">
                      {evt.identity_name || evt.identity_id}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 inline" />
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-semibold">
                      {evt.action}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 truncate max-w-[180px]">
                      {evt.resource}
                    </span>
                    <span className="text-slate-500 hidden md:inline">
                      ({evt.request_rate} req/min)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                    {evt.explanation}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <RiskBadge score={evt.risk_score} size="sm" />
                <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {evt.source}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal if selected */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-6 border border-cyan-500/30 bg-[#0D1424]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrustStateBadge state={selectedEvent.trust_state} size="md" />
                <h4 className="font-mono font-bold text-white text-sm">Event Detail</h4>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500">Identity:</span>
                  <div className="text-cyan-300 font-semibold">{selectedEvent.identity_id}</div>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>
                  <div className="text-slate-300">{new Date(selectedEvent.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-500">Action:</span>
                  <div className="text-amber-300 font-bold">{selectedEvent.action}</div>
                </div>
                <div>
                  <span className="text-slate-500">Resource:</span>
                  <div className="text-white font-bold">{selectedEvent.resource}</div>
                </div>
                <div>
                  <span className="text-slate-500">Request Rate:</span>
                  <div className="text-slate-200">{selectedEvent.request_rate} req/min</div>
                </div>
                <div>
                  <span className="text-slate-500">Source Context:</span>
                  <div className="text-slate-200">{selectedEvent.source}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold">Detection Explanation:</span>
                <p className="mt-1 p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-sans text-xs">
                  {selectedEvent.explanation}
                </p>
              </div>

              {selectedEvent.factors && selectedEvent.factors.length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold">Risk Factor Decomposition:</span>
                  <div className="mt-1 space-y-1.5">
                    {selectedEvent.factors.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-300">{f.reason}</span>
                        <span className="text-rose-400 font-bold">+{f.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
