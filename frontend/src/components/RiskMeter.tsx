import React from 'react';

interface RiskMeterProps {
  score: number; // 0 to 100
  size?: number;
  label?: string;
  sublabel?: string;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  size = 180,
  label = 'BEHAVIORAL RISK',
  sublabel
}) => {
  const clampedScore = Math.max(0, Math.min(100, score || 0));
  
  // Radius and arc math
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 240 degree gauge arc
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (arcLength * (clampedScore / 100));

  // Determine cyber color
  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)', text: 'text-rose-400', label: 'CRITICAL RISK' };
    if (s >= 45) return { stroke: '#F97316', glow: 'rgba(249, 115, 22, 0.55)', text: 'text-orange-400', label: 'SUSPICIOUS' };
    if (s >= 20) return { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)', text: 'text-amber-400', label: 'DRIFTING' };
    return { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.5)', text: 'text-emerald-400', label: 'NORMAL / SECURE' };
  };

  const currentStatus = getColor(clampedScore);

  return (
    <div className="relative flex flex-col items-center justify-center p-2 font-mono select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-[210deg] overflow-visible"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(30, 41, 59, 0.6)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Glowing active arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={currentStatus.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${currentStatus.glow})`,
              transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease'
            }}
          />
        </svg>

        {/* Center Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-black tracking-tight ${currentStatus.text}`}>
            {clampedScore.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            {currentStatus.label}
          </span>
          {sublabel && (
            <span className="text-[9px] text-slate-500 mt-1 max-w-[110px] truncate">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  );
};
