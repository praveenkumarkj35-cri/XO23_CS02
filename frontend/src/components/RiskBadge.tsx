import React from 'react';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskBadge: React.FC<Props> = ({ score, size = 'md', showLabel = false }) => {
  const s = Math.round(score);

  let colorClasses = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let label = 'Low Risk';

  if (s >= 75) {
    colorClasses = 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
    label = 'Critical Risk';
  } else if (s >= 55) {
    colorClasses = 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    label = 'Elevated Risk';
  } else if (s >= 30) {
    colorClasses = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    label = 'Moderate Risk';
  }

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-mono font-semibold',
    lg: 'text-sm px-3 py-1.5 font-mono font-bold'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border ${colorClasses} ${sizeClass}`}>
      <span>{s}/100</span>
      {showLabel && <span className="opacity-75 font-normal text-[11px]">({label})</span>}
    </span>
  );
};
