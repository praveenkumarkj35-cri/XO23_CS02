import React from 'react';
import { SecurityEvent } from '../types';
import { EventTable } from '../components/EventTable';
import { History, Clock, Activity } from 'lucide-react';

interface Props {
  events: SecurityEvent[];
}

export const BehavioralTimelinePage: React.FC<Props> = ({ events }) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            CHRONOLOGICAL BEHAVIORAL AUDIT TIMELINE
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Full audit log of non-human identity actions, sequential transitions, and state progressions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            Total Captured Events: <strong className="text-cyan-300">{events.length}</strong>
          </span>
        </div>
      </div>

      {/* Interactive Audit Table */}
      <EventTable events={events} />
    </div>
  );
};
