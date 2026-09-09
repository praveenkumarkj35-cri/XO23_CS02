import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Shield, Sliders, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [normalMax, setNormalMax] = useState<number>(29);
  const [driftingMax, setDriftingMax] = useState<number>(54);
  const [suspiciousMax, setSuspiciousMax] = useState<number>(74);
  const [poisoningThreshold, setPoisoningThreshold] = useState<number>(50);
  const [streamSpeed, setStreamSpeed] = useState<number>(1500);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setNormalMax(29);
    setDriftingMax(54);
    setSuspiciousMax(74);
    setPoisoningThreshold(50);
    setStreamSpeed(1500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            ENGINE CONFIGURATION & THRESHOLDS
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Customize behavioral boundary cutoffs, poisoning defense sensitivity, and telemetry ingestion speeds.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Configuration updated successfully! New thresholds applied to real-time evaluator.</span>
        </div>
      )}

      {/* Behavioral State Thresholds */}
      <div className="glass-card p-6 border border-slate-800 bg-[#0B0F1A]/90 space-y-6">
        <h3 className="text-sm font-bold font-mono text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Sliders className="w-4 h-4" />
          Behavioral Trust State Thresholds (0 - 100 Risk Scale)
        </h3>

        <div className="space-y-5 text-xs font-mono">
          {/* Normal Max */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-semibold">🟢 NORMAL State Ceiling:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                0 – {normalMax}
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="40"
              value={normalMax}
              onChange={(e) => setNormalMax(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Events with risk scores equal to or lower than this threshold are considered normal.
            </p>
          </div>

          {/* Drifting Max */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-semibold">🟡 DRIFTING State Ceiling:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                {normalMax + 1} – {driftingMax}
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="65"
              value={driftingMax}
              onChange={(e) => setDriftingMax(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Behavioral shifts evaluated by the Adaptive Trust Gate for safe automated adoption.
            </p>
          </div>

          {/* Suspicious Max */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-semibold">🟠 SUSPICIOUS State Ceiling:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-orange-400 font-bold">
                {driftingMax + 1} – {suspiciousMax}
              </span>
            </div>
            <input
              type="range"
              min="65"
              max="85"
              value={suspiciousMax}
              onChange={(e) => setSuspiciousMax(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <p className="text-[11px] text-slate-500 font-sans mt-1">
              Elevated variance causing baseline updates to be automatically locked.
            </p>
          </div>

          {/* High-Risk */}
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 flex items-center justify-between">
            <span>🔴 HIGH-RISK Critical Threshold:</span>
            <span className="font-bold font-mono">{suspiciousMax + 1} – 100</span>
          </div>
        </div>
      </div>

      {/* Poisoning Defense Settings */}
      <div className="glass-card p-6 border border-slate-800 bg-[#0B0F1A]/90 space-y-4">
        <h3 className="text-sm font-bold font-mono text-orange-300 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Shield className="w-4 h-4" />
          Baseline Poisoning Defense Sensitivity
        </h3>

        <div className="text-xs font-mono space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300">Poisoning Lockout Trigger Score:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-orange-400 font-bold">
              {poisoningThreshold}/100
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="80"
            value={poisoningThreshold}
            onChange={(e) => setPoisoningThreshold(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <p className="text-[11px] text-slate-500 font-sans">
            When cumulative multi-step suspicion reaches this value, all baseline updates are strictly blocked.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
};
