import React, { useState } from 'react';
import { Play, Square, RotateCcw, ShieldCheck, Zap, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';
import { triggerSimulationScenario, startSimulation, stopSimulation, resetSimulation } from '../services/api';

interface Props {
  activeScenario?: string;
  stepIndex?: number;
  targetIdentity?: string;
  onScenarioTriggered?: (scenario: string) => void;
}

export const SimulationPanel: React.FC<Props> = ({
  activeScenario = 'idle',
  stepIndex = 0,
  targetIdentity = 'payment-service',
  onScenarioTriggered
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [continuousLoop, setContinuousLoop] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for simulation');

  const handleTrigger = async (scenario: 'normal' | 'drift' | 'attack' | 'poisoning') => {
    try {
      setLoadingAction(scenario);
      setStatusMessage(`Triggering scenario: ${scenario.toUpperCase()}...`);
      
      if (continuousLoop) {
        await startSimulation(scenario, targetIdentity, 1500);
        setStatusMessage(`Active continuous stream: ${scenario.toUpperCase()}`);
      } else {
        await triggerSimulationScenario(scenario);
        setStatusMessage(`Dispatched single step: ${scenario.toUpperCase()}`);
      }
      
      if (onScenarioTriggered) {
        onScenarioTriggered(scenario);
      }
    } catch (e) {
      setStatusMessage(`Simulation error: ${e}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStop = async () => {
    try {
      setLoadingAction('stop');
      await stopSimulation();
      setContinuousLoop(false);
      setStatusMessage('Simulation halted. Stream paused.');
    } catch (e) {
      setStatusMessage(`Error stopping: ${e}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    try {
      setLoadingAction('reset');
      await resetSimulation();
      setContinuousLoop(false);
      setStatusMessage('State reset to baseline defaults across all identities.');
    } catch (e) {
      setStatusMessage(`Error resetting: ${e}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="glass-card p-5 border border-slate-800 bg-[#0B0F1A]/90">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2 font-mono">
                NHI ATTACK & DRIFT SIMULATOR
                <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase font-semibold">
                  Active Demo Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Test behavioral trust gates against synthetic attacks, baseline poisoning, and legitimate drift.
              </p>
            </div>
          </div>
        </div>

        {/* Status Pill & Mode Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={continuousLoop}
              onChange={(e) => setContinuousLoop(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Loop Stream (1.5s)</span>
          </label>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>SCENARIO:</span>
            <span className="font-bold text-cyan-400 uppercase">{activeScenario}</span>
            <span className="text-slate-500">|</span>
            <span>STEP: #{stepIndex}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        {/* 1. Normal Behavior */}
        <button
          onClick={() => handleTrigger('normal')}
          disabled={loadingAction !== null}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 hover:border-emerald-400/60 transition-all group active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-emerald-300 font-mono">▶ Normal</span>
          <span className="text-[10px] text-slate-400 text-center mt-1">🟢 Target: NORMAL</span>
        </button>

        {/* 2. Legitimate Drift */}
        <button
          onClick={() => handleTrigger('drift')}
          disabled={loadingAction !== null}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/30 hover:border-amber-400/60 transition-all group active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 mb-2 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-amber-300 font-mono">▶ Legitimate Drift</span>
          <span className="text-[10px] text-slate-400 text-center mt-1">🟡 Safe Adaptation</span>
        </button>

        {/* 3. Sudden Attack */}
        <button
          onClick={() => handleTrigger('attack')}
          disabled={loadingAction !== null}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/30 hover:border-rose-400/60 transition-all group active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mb-2 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-rose-300 font-mono">▶ Sudden Attack</span>
          <span className="text-[10px] text-slate-400 text-center mt-1">🔴 Spike & Block</span>
        </button>

        {/* 4. Baseline Poisoning */}
        <button
          onClick={() => handleTrigger('poisoning')}
          disabled={loadingAction !== null}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-orange-500/30 bg-orange-950/20 hover:bg-orange-900/30 hover:border-orange-400/60 transition-all group active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 mb-2 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-orange-300 font-mono">▶ Poisoning</span>
          <span className="text-[10px] text-slate-400 text-center mt-1">🛑 Multi-Step Drift</span>
        </button>

        {/* 5. Stop */}
        <button
          onClick={handleStop}
          disabled={loadingAction !== null}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-500 transition-all group active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-slate-700/50 text-slate-300 mb-2 group-hover:scale-110 transition-transform">
            <Square className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-300 font-mono">⏹ Stop</span>
          <span className="text-[10px] text-slate-400 text-center mt-1">Pause Stream</span>
        </button>

        {/* 6. Reset */}
        <button
          onClick={handleReset}
          disabled={loadingAction !== null}
          className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 hover:border-cyan-400/60 transition-all group active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
            <RotateCcw className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-cyan-300 font-mono">↻ Reset</span>
          <span className="text-[10px] text-slate-400 text-center mt-1">Revert Baseline</span>
        </button>
      </div>

      {/* Status banner */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-2">
          <span className="text-cyan-400">INFO:</span> {statusMessage}
        </span>
        <span className="text-slate-500 hidden sm:inline">Target NHI: <code className="text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded">{targetIdentity}</code></span>
      </div>
    </div>
  );
};
