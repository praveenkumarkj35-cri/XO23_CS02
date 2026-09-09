import React, { useState } from 'react';
import { BaselineChange } from '../types';
import { RiskBadge } from './RiskBadge';
import { ShieldCheck, ShieldAlert, Clock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { submitAdaptationDecision } from '../services/api';

interface Props {
  change: BaselineChange;
  onDecisionMade?: (changeId: string, decision: 'APPROVED' | 'REJECTED') => void;
}

export const BaselineChangeCard: React.FC<Props> = ({ change, onDecisionMade }) => {
  const [decision, setDecision] = useState<string>(change.decision);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleDecision = async (dec: 'APPROVED' | 'REJECTED') => {
    try {
      setIsSubmitting(true);
      await submitAdaptationDecision(change.id, dec);
      setDecision(dec);
      if (onDecisionMade) onDecisionMade(change.id, dec);
    } catch (e) {
      console.error('Error applying decision:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const decisionStyles = {
    APPROVED: {
      border: 'border-emerald-500/40 bg-emerald-950/20',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
      label: 'SAFE ADAPTATION APPROVED'
    },
    BLOCKED: {
      border: 'border-rose-500/40 bg-rose-950/20',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: ShieldAlert,
      label: 'BASELINE UPDATE BLOCKED'
    },
    REJECTED: {
      border: 'border-rose-500/30 bg-rose-950/15',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: XCircle,
      label: 'GATE REJECTED'
    },
    PENDING: {
      border: 'border-amber-500/30 bg-amber-950/20',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Clock,
      label: 'PENDING GATE REVIEW'
    }
  }[decision] || {
    border: 'border-slate-800 bg-slate-900',
    badge: 'bg-slate-800 text-slate-400 border-slate-700',
    icon: Clock,
    label: decision
  };

  const StatusIcon = decisionStyles.icon;

  return (
    <div className={`glass-card p-5 border transition-all ${decisionStyles.border}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-sm">
                {change.identity_id}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {change.change_type}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Proposed at {new Date(change.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge score={change.risk_score} size="sm" showLabel />
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${decisionStyles.badge}`}>
            {decisionStyles.label}
          </span>
        </div>
      </div>

      {/* Delta View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs font-mono">
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="text-slate-500 block mb-1">Previous Verified Baseline:</span>
          <span className="text-slate-300 break-words">{change.old_behavior}</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="text-cyan-400 block mb-1 font-bold">Proposed Behavior Delta:</span>
          <span className="text-white font-semibold break-words">{change.new_behavior}</span>
        </div>
      </div>

      {/* Rationale */}
      <div className="mt-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
        <span className="text-slate-400 font-mono font-semibold">Adaptive Trust Gate Rationale:</span>
        <p className="text-slate-300 mt-1 font-sans">{change.reason}</p>
      </div>

      {/* Actions */}
      {decision === 'PENDING' && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-3">
          <button
            onClick={() => handleDecision('REJECTED')}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 text-xs font-mono font-semibold"
          >
            ✕ Reject Adaptation
          </button>
          <button
            onClick={() => handleDecision('APPROVED')}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 text-xs font-mono font-semibold"
          >
            ✓ Approve Baseline Merge
          </button>
        </div>
      )}
    </div>
  );
};
