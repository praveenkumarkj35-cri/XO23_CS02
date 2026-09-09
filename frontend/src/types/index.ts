export type TrustState = "NORMAL" | "DRIFTING" | "SUSPICIOUS" | "HIGH-RISK";

export interface RiskFactor {
  factor: string;
  score: number;
  reason: string;
}

export interface BehaviorProfile {
  identity_id: string;
  normal_resources: string[];
  normal_actions: string[];
  average_request_rate: number;
  std_request_rate?: number;
  normal_hours_start?: number;
  normal_hours_end?: number;
  common_sequences?: string[][];
  sensitivity_profile?: string;
  confidence: number;
  version: number;
  updated_at?: string;
  baseline_snapshot_v1?: {
    version: number;
    normal_resources: string[];
    normal_actions: string[];
    average_request_rate: number;
    confidence: number;
  };
}

export interface Identity {
  id: string;
  name: string;
  type: string;
  owner: string;
  environment: string;
  current_state: TrustState;
  trust_score: number;
  risk_score: number;
  baseline_confidence: number;
  created_at: string;
  last_seen: string;
  profile?: BehaviorProfile;
}

export interface SecurityEvent {
  id: string;
  identity_id: string;
  identity_name?: string;
  action: string;
  resource: string;
  timestamp: string;
  request_rate: number;
  source: string;
  sensitivity: string;
  risk_score: number;
  trust_state: TrustState;
  explanation: string;
  factors: RiskFactor[];
}

export interface SecurityAlert {
  id: string;
  identity_id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  timestamp: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
}

export interface BaselineChange {
  id: string;
  identity_id: string;
  change_type: string;
  old_behavior: string;
  new_behavior: string;
  risk_score: number;
  decision: "APPROVED" | "REJECTED" | "PENDING" | "BLOCKED";
  reason: string;
  timestamp: string;
}

export interface PoisoningState {
  identity_id: string;
  suspicion_score: number;
  gradual_drifts_count: number;
  baseline_changes_attempted: number;
  baseline_changes_approved: number;
  baseline_changes_blocked: number;
  attack_stage:
    | "NORMAL"
    | "SMALL_DRIFT"
    | "REPEATED_DRIFT"
    | "INCREASING_FREQUENCY"
    | "SUSPICIOUS"
    | "POISONING_DETECTED"
    | "BASELINE_PROTECTED";
  last_evaluated?: string;
}

export interface BaselineHistory {
  id: string;
  identity_id: string;
  version: number;
  normal_resources: string[];
  normal_actions: string[];
  average_request_rate: number;
  confidence: number;
  change_reason?: string;
  change_type?: string;
  timestamp: string;
}

export interface BaselineDetails {
  identity_id: string;
  current_version: number;
  confidence: number;
  current_resources: string[];
  current_actions: string[];
  current_average_request_rate: number;
  sensitivity_profile?: string;
  baseline_snapshot_v1?: {
    version: number;
    normal_resources: string[];
    normal_actions: string[];
    average_request_rate: number;
    confidence: number;
  };
  last_updated?: string;
}

export interface PredictionResult {
  id: string;
  identity_id: string;
  event_id: string;
  statistical_risk_score?: number;
  statistical_state?: string;
  ml_prediction: "NORMAL" | "DRIFTING" | "SUSPICIOUS" | "HIGH_RISK";
  ml_confidence: number;
  ml_probabilities: Record<string, number>;
  ml_reasons: string[];
  features: Record<string, number>;
  feature_importances?: Record<string, number>;
  model_available: boolean;
  timestamp: string;
  disclaimer: string;
}

export interface ModelInfo {
  model_available: boolean;
  accuracy: number;
  feature_importances: Record<string, number>;
  features: string[];
  labels: string[];
  disclaimer: string;
}

export interface EvaluationResultItem {
  id: string;
  run_id: string;
  scenario: string;
  expected_state: string;
  actual_state: string;
  expected_baseline_decision: string;
  actual_baseline_decision: string;
  risk_score: number;
  passed: boolean;
  explanation: string;
  timestamp: string;
}

export interface EvaluationRunResult {
  run_id: string;
  total_scenarios: number;
  passed_count: number;
  failed_count: number;
  pass_rate_pct: number;
  ps02_compliant: boolean;
  surprise_challenge_passed: boolean;
  disclaimer: string;
  results: EvaluationResultItem[];
}

export interface EvaluationMetrics {
  disclaimer: string;
  detection_accuracy_pct: number;
  false_positive_rate_pct: number;
  drift_detection_rate_pct: number;
  poisoning_defense_rate_pct: number;
  baseline_protection_rate_pct: number;
  mean_time_to_detect_ms: number;
  total_simulated_workloads: number;
  attack_vectors_tested: { vector: string; mitigated_pct: number }[];
  latency_percentiles_ms: {
    p50: number;
    p90: number;
    p99: number;
  };
}

export interface JudgeDemoStep {
  step: number;
  total_steps: number;
  title: string;
  description: string;
  is_complete: boolean;
}

export interface JudgeDemoStatus {
  is_running: boolean;
  is_complete: boolean;
  current_step: number;
  total_steps: number;
  current_step_title: string;
  scenario: string;
  summary: {
    total_events: number;
    normal_events: number;
    legitimate_drift_events: number;
    blocked_attack_events: number;
    poisoning_attempts: number;
    blocked_baseline_updates: number;
    approved_baseline_updates: number;
    trusted_baseline_version: number;
    baseline_confidence: number;
    final_trust_state: string;
    final_trust_score: number;
    final_risk_score: number;
    attack_stage: string;
  };
  verdicts: {
    legitimate_evolution: 'APPROVED' | 'PENDING' | 'REJECTED';
    sudden_attack: 'BLOCKED' | 'PENDING';
    baseline_poisoning: 'BLOCKED' | 'PENDING';
    trusted_baseline: 'PROTECTED' | 'PENDING';
  };
}

export interface WebSocketPayload {
  type: string;
  scenario?: string;
  step_index?: number;
  judge_demo?: JudgeDemoStep | null;
  event: SecurityEvent;
  identity: Partial<Identity>;
  baseline_change?: BaselineChange | null;
  baseline_snapshot?: any;
  alert?: SecurityAlert | null;
  poisoning_state?: PoisoningState | null;
  prediction?: {
    id?: string;
    prediction: string;
    confidence: number;
    probabilities: Record<string, number>;
    features: Record<string, number>;
    reasons: string[];
    disclaimer: string;
  } | null;
}
