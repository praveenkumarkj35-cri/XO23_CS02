import React from 'react';

interface Props {
  trustScore: number;
  riskScore: number;
  size?: number;
}

export const TrustGauge: React.FC<Props> = ({ trustScore, riskScore, size = 160 }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  // Normalized 0 to 100
  const tOffset = circumference - (trustScore / 100) * circumference * 0.75;
  const rOffset = circumference - (riskScore / 100) * circumference * 0.75;

  let trustColor = '#10B981'; // Green
  if (trustScore < 50) trustColor = '#EF4444';
  else if (trustScore < 75) trustColor = '#F59E0B';

  let riskColor = '#10B981';
  if (riskScore >= 75) riskColor = '#EF4444';
  else if (riskScore >= 55) riskColor = '#F97316';
  else if (riskScore >= 30) riskColor = '#F59E0B';

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <svg width={size} height={size} viewBox="0 0 160 160" className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="#1E293B"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
        />

        {/* Trust Arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={trustColor}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={tOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold font-mono text-white tracking-tight">
          {trustScore.toFixed(0)}%
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Trust Score
        </span>
        <div className="mt-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono">
          <span className="text-slate-500">Risk: </span>
          <span style={{ color: riskColor }} className="font-bold">{riskScore.toFixed(0)}/100</span>
        </div>
      </div>
    </div>
  );
};
