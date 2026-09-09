from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class BehaviorProfileSchema(BaseModel):
    identity_id: str
    normal_resources: List[str]
    normal_actions: List[str]
    average_request_rate: float
    std_request_rate: float
    normal_hours_start: int
    normal_hours_end: int
    common_sequences: List[List[str]]
    sensitivity_profile: str
    confidence: float
    version: int
    updated_at: datetime
    baseline_snapshot_v1: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class IdentitySchema(BaseModel):
    id: str
    name: str
    type: str
    owner: str
    environment: str
    current_state: str
    trust_score: float
    risk_score: float
    baseline_confidence: float
    created_at: datetime
    last_seen: datetime
    profile: Optional[BehaviorProfileSchema] = None

    class Config:
        from_attributes = True

class RiskFactor(BaseModel):
    factor: str
    score: float
    reason: str

class EventSchema(BaseModel):
    id: str
    identity_id: str
    action: str
    resource: str
    timestamp: datetime
    request_rate: float
    source: str
    sensitivity: str
    risk_score: float
    trust_state: str
    explanation: str
    factors: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

class AlertSchema(BaseModel):
    id: str
    identity_id: str
    severity: str
    title: str
    description: str
    timestamp: datetime
    status: str

    class Config:
        from_attributes = True

class BaselineChangeSchema(BaseModel):
    id: str
    identity_id: str
    change_type: str
    old_behavior: str
    new_behavior: str
    risk_score: float
    decision: str
    reason: str
    timestamp: datetime

    class Config:
        from_attributes = True

class PoisoningStateSchema(BaseModel):
    identity_id: str
    suspicion_score: float
    gradual_drifts_count: int
    baseline_changes_attempted: int
    baseline_changes_approved: int
    baseline_changes_blocked: int
    attack_stage: str
    last_evaluated: datetime

    class Config:
        from_attributes = True

class BaselineHistorySchema(BaseModel):
    id: str
    identity_id: str
    version: int
    normal_resources: List[str] = []
    normal_actions: List[str] = []
    average_request_rate: float
    confidence: float
    change_reason: Optional[str] = ""
    change_type: Optional[str] = ""
    timestamp: datetime

    class Config:
        from_attributes = True

class PredictionResultSchema(BaseModel):
    id: str
    identity_id: str
    event_id: str
    statistical_risk_score: float
    statistical_state: str
    ml_prediction: str
    ml_confidence: float
    ml_probabilities: Dict[str, float] = {}
    ml_reasons: List[str] = []
    features: Dict[str, float] = {}
    feature_importances: Dict[str, float] = {}
    model_available: bool
    timestamp: datetime
    disclaimer: str

    class Config:
        from_attributes = True

class EvaluationResultSchema(BaseModel):
    id: str
    run_id: str
    scenario: str
    expected_state: str
    actual_state: str
    expected_baseline_decision: str
    actual_baseline_decision: str
    risk_score: float
    passed: bool
    explanation: str
    timestamp: datetime

    class Config:
        from_attributes = True

class EvaluationRunResponse(BaseModel):
    run_id: str
    results: List[EvaluationResultSchema]
    total_scenarios: int
    passed_count: int
    failed_count: int
    pass_rate_pct: float
    ps02_compliant: bool
    surprise_challenge_passed: bool
    disclaimer: str

class SimulationControlRequest(BaseModel):
    scenario: Optional[str] = "normal" # normal, drift, attack, poisoning, judge_demo
    identity_id: Optional[str] = "payment-service"
    speed_ms: Optional[int] = 1500

class ManualDecisionRequest(BaseModel):
    change_id: str
    decision: str # APPROVED, REJECTED

class SlowBurnObservationSchema(BaseModel):
    id: str
    identity_id: str
    window_number: int
    timestamp: datetime
    instant_risk: float
    cumulative_risk: float
    evidence_score: float
    trust_state: str
    deviation_type: str
    action: str
    resource: str
    explanation: str
    decision: str
    evidence_breakdown: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class SlowBurnStateSchema(BaseModel):
    identity_id: str
    cumulative_evidence_score: float
    cumulative_risk_score: float
    observation_window: int
    evidence_count: int
    repeated_deviation_count: int
    persistence_score: float
    resource_novelty_count: int
    action_novelty_count: int
    frequency_deviation_count: int
    sequence_deviation_count: int
    temporal_deviation_count: int
    sensitivity_events: int
    first_deviation_time: Optional[datetime] = None
    last_deviation_time: Optional[datetime] = None
    detection_time: Optional[datetime] = None
    previous_risk_score: float
    current_trust_state: str
    baseline_decision: str
    trusted_baseline_status: str
    last_evaluated: datetime

    class Config:
        from_attributes = True

class SlowBurnStatusResponse(BaseModel):
    is_running: bool
    current_window: int
    total_windows: int
    target_identity: str
    monitoring_status: str
    current_trust_state: str
    instant_risk: float
    cumulative_risk: float
    cumulative_evidence_score: float
    baseline_decision: str
    trusted_baseline_status: str
    explanation: str
    evidence_breakdown: Dict[str, Any]
    progression: List[Dict[str, Any]]
    observations: List[SlowBurnObservationSchema]
    recent_events: List[EventSchema]
