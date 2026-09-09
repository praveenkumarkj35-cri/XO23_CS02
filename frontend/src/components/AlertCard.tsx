import React from 'react';
import { SecurityAlert } from '../types';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface Props {
  alert: SecurityAlert;
  onDismiss?: (id: string) => void;
}

export const AlertCard: React.FC<Props> = ({ alert, onDismiss }) => {
  const config = {
    CRITICAL: {
      border: 'border-rose-500/40 bg-rose-950/20',
      badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
    },
    HIGH: {
      border: 'border-orange-500/40 bg-orange-950/20',
      badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      icon: AlertTriangle,
      iconColor: 'text-orange-400',
    },
    MEDIUM: {
      border: 'border-amber-500/40 bg-amber-950/20',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    LOW: {
      border: 'border-cyan-500/30 bg-cyan-950/20',
      badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      icon: Info,
      iconColor: 'text-cyan-400',
    }
  }[alert.severity] || {
    border: 'border-slate-800 bg-slate-900',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: Info,
    iconColor: 'text-slate-400',
  };

  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border ${config.border} glass-card transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${config.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${config.badge}`}>
                {alert.severity}
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {alert.identity_id}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white mt-1">
              {alert.title}
            </h4>
            <p className="text-xs text-slate-300 mt-1 font-sans">
              {alert.description}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 text-xs"
            title="Acknowledge"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
