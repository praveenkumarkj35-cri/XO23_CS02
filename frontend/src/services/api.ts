import { 
  Identity, SecurityEvent, SecurityAlert, BaselineChange, PoisoningState, 
  EvaluationMetrics, PredictionResult, ModelInfo, BaselineDetails, 
  BaselineHistory, EvaluationRunResult, JudgeDemoStatus 
} from '../types';

// Deterministic production vs. local backend configuration
const PRODUCTION_API_URL = 'https://xo23-cs02-2.onrender.com';
const PRODUCTION_WS_URL = 'wss://xo23-cs02-2.onrender.com/ws/events';
const LOCAL_API_URL = 'http://localhost:8000';
const LOCAL_WS_URL = 'ws://localhost:8000/ws/events';

export function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
}

export function getApiBaseUrl(): string {
  // 1. Explicit build-time environment variable if set
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim() !== '') {
    return envApiUrl.trim().replace(/\/+$/, '');
  }

  // 2. Local development fallback
  if (isLocalHost()) {
    return LOCAL_API_URL;
  }

  // 3. Guaranteed production backend URL for Netlify and other deployments
  return PRODUCTION_API_URL;
}

const API_BASE = getApiBaseUrl();

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function fetchIdentities(): Promise<Identity[]> {
  const res = await fetch(`${API_BASE}/api/identities`);
  if (!res.ok) throw new Error('Failed to fetch identities');
  return res.json();
}

export async function fetchIdentity(id: string): Promise<Identity> {
  const res = await fetch(`${API_BASE}/api/identities/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch identity ${id}`);
  return res.json();
}

export async function fetchEvents(limit = 50, identityId?: string, trustState?: string): Promise<SecurityEvent[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (identityId) params.append('identity_id', identityId);
  if (trustState) params.append('trust_state', trustState);
  const res = await fetch(`${API_BASE}/api/events?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchAlerts(limit = 25, status?: string): Promise<SecurityAlert[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (status) params.append('status', status);
  const res = await fetch(`${API_BASE}/api/alerts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function fetchBaselineChanges(limit = 50, identityId?: string): Promise<BaselineChange[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (identityId) params.append('identity_id', identityId);
  const res = await fetch(`${API_BASE}/api/baseline-changes?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch baseline changes');
  return res.json();
}

export async function fetchPoisoningDefense(): Promise<PoisoningState[]> {
  const res = await fetch(`${API_BASE}/api/poisoning-defense`);
  if (!res.ok) throw new Error('Failed to fetch poisoning states');
  return res.json();
}

export async function fetchEvaluation(): Promise<EvaluationMetrics> {
  const res = await fetch(`${API_BASE}/api/evaluation`);
  if (!res.ok) throw new Error('Failed to fetch evaluation metrics');
  return res.json();
}

// ML Predictions & Model Info
export async function fetchPredictions(limit = 50, identityId?: string): Promise<PredictionResult[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (identityId) params.append('identity_id', identityId);
  const res = await fetch(`${API_BASE}/api/predictions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch ML predictions');
  return res.json();
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  const res = await fetch(`${API_BASE}/api/model/info`);
  if (!res.ok) throw new Error('Failed to fetch model info');
  return res.json();
}

// Baseline Comparison & History
export async function fetchBaselineDetails(identityId: string): Promise<BaselineDetails> {
  const res = await fetch(`${API_BASE}/api/baseline/${identityId}`);
  if (!res.ok) throw new Error(`Failed to fetch baseline for ${identityId}`);
  return res.json();
}

export async function fetchBaselineHistory(identityId: string, limit = 20): Promise<BaselineHistory[]> {
  const res = await fetch(`${API_BASE}/api/baseline/${identityId}/history?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch baseline history for ${identityId}`);
  return res.json();
}

// Live Automated Evaluation Runner
export async function runEvaluation(): Promise<EvaluationRunResult> {
  const res = await fetch(`${API_BASE}/api/evaluation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error('Failed to execute evaluation suite');
  return res.json();
}

export async function fetchLatestEvaluationResults(): Promise<EvaluationRunResult | null> {
  const res = await fetch(`${API_BASE}/api/evaluation/results`);
  if (!res.ok) throw new Error('Failed to fetch latest evaluation results');
  return res.json();
}

// Simulation Triggers
export async function triggerSimulationScenario(scenario: 'normal' | 'drift' | 'attack' | 'poisoning' | 'judge-demo' | 'legitimate-drift') {
  const res = await fetch(`${API_BASE}/api/simulation/${scenario}`, { method: 'POST' });
  return res.json();
}

export async function triggerJudgeDemo() {
  const res = await fetch(`${API_BASE}/api/simulation/judge-demo`, { method: 'POST' });
  return res.json();
}

// Judge Demo dedicated endpoints
export async function startJudgeDemo() {
  const res = await fetch(`${API_BASE}/api/judge-demo/start`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start Judge Demo');
  return res.json();
}

export async function stopJudgeDemo() {
  const res = await fetch(`${API_BASE}/api/judge-demo/stop`, { method: 'POST' });
  return res.json();
}

export async function resetJudgeDemo() {
  const res = await fetch(`${API_BASE}/api/judge-demo/reset`, { method: 'POST' });
  return res.json();
}

export async function executeJudgeDemoStep(step: number) {
  const res = await fetch(`${API_BASE}/api/judge-demo/step/${step}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to execute Judge Demo step ${step}`);
  return res.json();
}

export async function fetchJudgeDemoStatus(): Promise<JudgeDemoStatus> {
  const res = await fetch(`${API_BASE}/api/judge-demo/status`);
  if (!res.ok) throw new Error('Failed to fetch Judge Demo status');
  return res.json();
}

export async function startSimulation(scenario = 'normal', identityId = 'payment-service', speedMs = 1500) {
  const res = await fetch(`${API_BASE}/api/simulation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, identity_id: identityId, speed_ms: speedMs })
  });
  return res.json();
}

export async function stopSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/stop`, { method: 'POST' });
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/reset`, { method: 'POST' });
  return res.json();
}

export async function submitAdaptationDecision(changeId: string, decision: 'APPROVED' | 'REJECTED') {
  const res = await fetch(`${API_BASE}/api/adaptation/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ change_id: changeId, decision })
  });
  return res.json();
}

export function getWebSocketUrl(): string {
  // 1. Explicit WebSocket URL if configured (VITE_WS_URL)
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim() !== '') {
    return envWsUrl.trim();
  }

  // 2. Derive WebSocket URL from VITE_API_URL if configured
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim() !== '') {
    try {
      const url = new URL(envApiUrl.trim());
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = url.host;
      return `${wsProtocol}//${host}/ws/events`;
    } catch {
      // Fallback if URL parsing fails
    }
  }

  // 3. Fallback ONLY for local development (localhost / 127.0.0.1)
  if (isLocalHost()) {
    const protocol = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    return `${protocol}//localhost:8000/ws/events`;
  }

  // 4. Guaranteed production fallback
  // NEVER construct a production WebSocket URL using the current Netlify hostname with port 8000
  return PRODUCTION_WS_URL;
}

// ============================================================
// SLOW-BURN DETECTION API — Surprise Challenge 2
// ============================================================

export async function fetchSlowBurnStatus(identityId: string = 'payment-service') {
  const res = await fetch(`${API_BASE}/api/slow-burn/status?identity_id=${identityId}`);
  if (!res.ok) throw new Error('Failed to fetch slow-burn status');
  return res.json();
}

export async function fetchSlowBurnHistory(identityId: string = 'payment-service', limit: number = 20) {
  const res = await fetch(`${API_BASE}/api/slow-burn/history?identity_id=${identityId}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch slow-burn history');
  return res.json();
}

export async function startSlowBurnSimulation(identityId: string = 'payment-service', speedMs: number = 2200) {
  const res = await fetch(`${API_BASE}/api/simulation/slow-burn/start?identity_id=${identityId}&speed_ms=${speedMs}`, {
    method: 'POST'
  });
  return res.json();
}

export async function stopSlowBurnSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/slow-burn/stop`, { method: 'POST' });
  return res.json();
}

export async function resetSlowBurnSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/slow-burn/reset`, { method: 'POST' });
  return res.json();
}

export async function executeSlowBurnStep(window: number, isLegitimate: boolean = false) {
  const res = await fetch(
    `${API_BASE}/api/simulation/slow-burn/step/${window}?is_legitimate=${isLegitimate}`,
    { method: 'POST' }
  );
  return res.json();
}

export async function runSlowBurnEvaluation() {
  const res = await fetch(`${API_BASE}/api/evaluation/slow-burn`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run slow-burn evaluation');
  return res.json();
}
