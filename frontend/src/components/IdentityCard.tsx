import React from 'react';
import { Identity } from '../types';
import { TrustStateBadge } from './TrustStateBadge';
import { RiskBadge } from './RiskBadge';
import { Bot, Shield, Activity, ChevronRight, Clock, Database, Layers } from 'lucide-react';

interface Props {
  identity: Identity;
  onClick?: () => void;
  isSelected?: boolean;
}

export const IdentityCard: React.FC<Props> = ({ identity, onClick, isSelected = false }) => {
  const typeIcons: Record<string, any> = {
    microservice: Layers,
    service_account: Shield,
    ci_cd_runner: Activity,
    bot: Bot,
    cloud_workload: Database,
  };

  const Icon = typeIcons[identity.type] || Shield;

  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 cursor-pointer border transition-all ${
        isSelected
          ? 'border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
          : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700/80">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-mono tracking-tight hover:text-cyan-300">
              {identity.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
              <span className="text-cyan-400">{identity.id}</span>
              <span>•</span>
              <span className="capitalize">{identity.environment}</span>
            </div>
          </div>
        </div>

        <TrustStateBadge state={identity.current_state} size="sm" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center font-mono">
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Trust Score</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {identity.trust_score.toFixed(1)}%
          </div>
        </div>

        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Risk Level</div>
          <div className="text-sm font-bold mt-0.5">
            <RiskBadge score={identity.risk_score} size="sm" />
          </div>
        </div>

        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Confidence</div>
          <div className="text-sm font-bold text-cyan-400 mt-0.5">
            {identity.baseline_confidence.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 truncate max-w-[200px]">
          <span className="text-slate-500">Owner:</span>
          <span className="text-slate-300">{identity.owner}</span>
        </span>
        <span className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
          Details <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
