import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  subtitle?: string;
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'orange' | 'purple';
}

export const StatCard: React.FC<Props> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  subtitle,
  accentColor = 'cyan'
}) => {
  const colorMap = {
    cyan: {
      border: 'group-hover:border-cyan-500/50',
      icon: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
      topLine: 'bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent'
    },
    emerald: {
      border: 'group-hover:border-emerald-500/50',
      icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
      topLine: 'bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent'
    },
    amber: {
      border: 'group-hover:border-amber-500/50',
      icon: 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      topLine: 'bg-gradient-to-r from-transparent via-amber-500/70 to-transparent'
    },
    orange: {
      border: 'group-hover:border-orange-500/50',
      icon: 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.25)]',
      topLine: 'bg-gradient-to-r from-transparent via-orange-500/70 to-transparent'
    },
    rose: {
      border: 'group-hover:border-rose-500/50',
      icon: 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
      topLine: 'bg-gradient-to-r from-transparent via-rose-500/70 to-transparent'
    },
    purple: {
      border: 'group-hover:border-purple-500/50',
      icon: 'text-purple-300 bg-purple-500/10 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
      topLine: 'bg-gradient-to-r from-transparent via-purple-500/70 to-transparent'
    },
  }[accentColor];

  const changeStyles = {
    positive: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/40',
    negative: 'text-rose-400 bg-rose-950/30 border-rose-500/40',
    neutral: 'text-slate-400 bg-slate-900 border-slate-700'
  }[changeType];

  return (
    <div className={`group glass-card p-4 sm:p-5 relative overflow-hidden border border-slate-800/90 ${colorMap.border} transition-all duration-300`}>
      {/* Top ambient highlight line */}
      <div className={`absolute top-0 left-0 right-0 h-[1.5px] ${colorMap.topLine}`} />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          {title}
        </span>
        <div className={`p-2 sm:p-2.5 rounded-lg border transition-all ${colorMap.icon}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
          {value}
        </div>
        {change && (
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded font-mono font-bold border ${changeStyles}`}>
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 truncate font-mono">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};
