import React from 'react';
import { TrustState } from '../types';

interface Props {
  state: TrustState | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDot?: boolean;
}

export const TrustStateBadge: React.FC<Props> = ({ state, size = 'md', showDot = true }) => {
  const normalizedState = (state || 'NORMAL').toUpperCase().replace('_', '-') as string;

  const config = (() => {
    switch (normalizedState) {
      case 'NORMAL':
        return {
          label: 'NORMAL',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/40',
          dot: 'bg-emerald-400',
          glow: 'glow-green shadow-[0_0_12px_rgba(16,185,129,0.35)]'
        };
      case 'DRIFTING':
        return {
          label: 'DRIFTING',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/40',
          dot: 'bg-amber-400',
          glow: 'glow-yellow shadow-[0_0_12px_rgba(245,158,11,0.35)]'
        };
      case 'SUSPICIOUS':
        return {
          label: 'SUSPICIOUS',
          bg: 'bg-orange-500/15',
          text: 'text-orange-400',
          border: 'border-orange-500/50',
          dot: 'bg-orange-400',
          glow: 'glow-orange shadow-[0_0_16px_rgba(249,115,22,0.45)]'
        };
      case 'HIGH-RISK':
      case 'CRITICAL':
      case 'BLOCKED':
        return {
          label: normalizedState,
          bg: 'bg-rose-500/15',
          text: 'text-rose-400',
          border: 'border-rose-500/50',
          dot: 'bg-rose-500',
          glow: 'glow-red shadow-[0_0_18px_rgba(239,68,68,0.55)]'
        };
      case 'PROTECTED':
        return {
          label: 'PROTECTED',
          bg: 'bg-cyan-500/15',
          text: 'text-cyan-300',
          border: 'border-cyan-500/50',
          dot: 'bg-cyan-400',
          glow: 'glow-cyan shadow-[0_0_14px_rgba(6,182,212,0.4)]'
        };
      default:
        return {
          label: state,
          bg: 'bg-slate-800/80',
          text: 'text-slate-300',
          border: 'border-slate-700',
          dot: 'bg-slate-400',
          glow: ''
        };
    }
  })();

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 gap-2 font-semibold tracking-wide',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-bold tracking-wider',
    xl: 'text-base px-4 py-2 gap-3 font-black tracking-widest'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono rounded-lg border backdrop-blur-md uppercase ${config.bg} ${config.text} ${config.border} ${config.glow} ${sizeStyles}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
          />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};
