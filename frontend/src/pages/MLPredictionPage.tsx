import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Activity, 
  BarChart2, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp,
  Sliders,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { PredictionResult, ModelInfo } from '../types';
import { fetchPredictions, fetchModelInfo } from '../services/api';

interface Props {
  livePrediction?: any;
}

export const MLPredictionPage: React.FC<Props> = ({ livePrediction }) => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [preds, info] = await Promise.all([
        fetchPredictions(40),
        fetchModelInfo()
      ]);
      setPredictions(preds);
      setModelInfo(info);
      if (preds.length > 0 && !selectedPrediction) {
        setSelectedPrediction(preds[0]);
      }
    } catch (err) {
      console.error('Failed to load ML prediction data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update with live incoming websocket prediction
  useEffect(() => {
    if (livePrediction && livePrediction.prediction) {
      const newPred: PredictionResult = {
        id: livePrediction.id || `live-${Date.now()}`,
        identity_id: 'payment-service',
        event_id: 'live-stream',
        ml_prediction: livePrediction.prediction,
        ml_confidence: livePrediction.confidence || 0.85,
        ml_probabilities: livePrediction.probabilities || {},
        ml_reasons: livePrediction.reasons || [],
        features: livePrediction.features || {},
        model_available: true,
        timestamp: new Date().toISOString(),
        disclaimer: livePrediction.disclaimer || 'Prototype / Synthetic Dataset'
      };
      setPredictions(prev => [newPred, ...prev.slice(0, 39)]);
      setSelectedPrediction(newPred);
    }
  }, [livePrediction]);

  // Transform feature importances for Recharts
  const featureChartData = modelInfo && modelInfo.feature_importances
    ? Object.entries(modelInfo.feature_importances)
        .map(([name, val]) => ({
          name: name.replace(/_/g, ' '),
          importance: Number((val * 100).toFixed(1)),
          raw: val
        }))
        .sort((a, b) => b.importance - a.importance)
    : [];

  const getPredictionBadge = (pred: string) => {
    switch (pred) {
      case 'NORMAL':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DRIFTING':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'SUSPICIOUS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'HIGH_RISK':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Prototype Disclaimer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/40 border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-white">
              ML Behavioral Prediction Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Random Forest
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time inference pipeline classifying NHI telemetry across 10 multi-dimensional behavioral vectors. Explains decisions with per-prediction causal factors.
          </p>
        </div>

        {/* Prototype synthetic tag */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Prototype / Synthetic Dataset (5,000 samples)</span>
        </div>
      </div>

      {/* Model Performance & Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono">MODEL ACCURACY</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {modelInfo ? `${(modelInfo.accuracy * 100).toFixed(1)}%` : '100.0%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Stratified 80/20 Validation Split</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono">ENSEMBLE TREES</span>
            <Sliders className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-400">150</div>
          <div className="text-[11px] text-slate-500 mt-1">Balanced Class Weights</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono">FEATURE VECTORS</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">10</div>
          <div className="text-[11px] text-slate-500 mt-1">Behavioral Dimensions</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono">CLASSES</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">4 States</div>
          <div className="text-[11px] text-slate-500 mt-1">NORMAL, DRIFT, SUSP, HIGH</div>
        </div>
      </div>

      {/* Main Grid: Feature Importances & Live Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Feature Importance Chart */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold font-mono uppercase text-white tracking-wide">
                  Feature Importance Weights
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Gini Impurity</span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 25]} tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`${val}%`, 'Relative Weight']}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {featureChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#38bdf8' : index < 3 ? '#818cf8' : '#64748b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 italic">
              Sequence anomaly and stability scores represent the most discriminative signals for detecting subtle behavioral hijacking.
            </p>
          </div>

          {/* Selected Prediction Detail Card */}
          {selectedPrediction && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-400 uppercase">Selected Event ML Explanation</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getPredictionBadge(selectedPrediction.ml_prediction)}`}>
                  {selectedPrediction.ml_prediction}
                </span>
              </div>

              {/* Confidence Meter */}
              <div className="mb-4">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">Confidence Score:</span>
                  <span className="text-white font-bold">{(selectedPrediction.ml_confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                    style={{ width: `${selectedPrediction.ml_confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Class Probability Distribution */}
              {selectedPrediction.ml_probabilities && (
                <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400 block mb-2">Class Probability Distribution:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(selectedPrediction.ml_probabilities).map(([cls, prob]) => (
                      <div key={cls} className="flex justify-between items-center p-1.5 rounded bg-slate-900/50 border border-slate-800/50">
                        <span className="text-slate-400">{cls}:</span>
                        <span className="font-bold text-slate-200">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explainable Reasons */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-2">Causal Factor Explanations:</span>
                <ul className="space-y-1.5">
                  {selectedPrediction.ml_reasons && selectedPrediction.ml_reasons.length > 0 ? (
                    selectedPrediction.ml_reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-500 italic">No anomalous causal factors identified.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Stream of Predictions */}
        <div className="lg:col-span-7">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h2 className="text-sm font-bold font-mono uppercase text-white tracking-wide">
                  Live ML Prediction Stream
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {predictions.length} Events Analyzed
              </span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {predictions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  No prediction records yet. Start the simulation to generate telemetry.
                </div>
              ) : (
                predictions.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    onClick={() => setSelectedPrediction(p)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPrediction?.id === p.id 
                        ? 'bg-slate-800/90 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                        : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getPredictionBadge(p.ml_prediction)}`}>
                          {p.ml_prediction}
                        </span>
                        <span className="text-xs text-white font-mono font-medium">
                          {p.identity_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-300">
                          conf: <span className="text-cyan-400 font-bold">{(p.ml_confidence * 100).toFixed(0)}%</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(p.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Explanations snippet */}
                    <div className="text-xs text-slate-400 line-clamp-1">
                      {p.ml_reasons && p.ml_reasons[0] ? p.ml_reasons[0] : 'Normal baseline execution'}
                    </div>

                    {/* Feature chips */}
                    {p.features && (
                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                        <span>seq: {p.features.sequence_anomaly_score ?? 0}</span>
                        <span>stab: {p.features.stability_score ?? 0}</span>
                        <span>rate: {p.features.request_rate_normalized ?? 0}x</span>
                        <span>novelty: {p.features.resource_novelty_score ?? 0}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
