from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from ..database import Base

class Identity(Base):
    __tablename__ = "identities"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # microservice, service_account, ci_cd_runner, bot, cloud_workload
    owner = Column(String, nullable=False)
    environment = Column(String, default="production")
    current_state = Column(String, default="NORMAL")  # NORMAL, DRIFTING, SUSPICIOUS, HIGH-RISK
    trust_score = Column(Float, default=95.0)  # 0 to 100
    risk_score = Column(Float, default=5.0)    # 0 to 100
    baseline_confidence = Column(Float, default=98.0) # 0 to 100
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    profile = relationship("BehaviorProfile", back_populates="identity", uselist=False)
    events = relationship("Event", back_populates="identity")
    baseline_changes = relationship("BaselineChange", back_populates="identity")
    poisoning_state = relationship("PoisoningState", back_populates="identity", uselist=False)
    predictions = relationship("PredictionResult", back_populates="identity")
    slow_burn_state = relationship("SlowBurnState", back_populates="identity", uselist=False)
    slow_burn_observations = relationship("SlowBurnObservation", back_populates="identity")

class BehaviorProfile(Base):
    __tablename__ = "behavior_profiles"

    identity_id = Column(String, ForeignKey("identities.id"), primary_key=True)
    normal_resources = Column(JSON, default=list)  # list of strings
    normal_actions = Column(JSON, default=list)    # list of strings
    average_request_rate = Column(Float, default=100.0) # req/min
    std_request_rate = Column(Float, default=15.0)
    normal_hours_start = Column(Integer, default=8)  # 08:00
    normal_hours_end = Column(Integer, default=18)    # 18:00
    common_sequences = Column(JSON, default=list)  # pairs like [["READ", "WRITE"]]
    sensitivity_profile = Column(String, default="medium")
    confidence = Column(Float, default=98.0)
    version = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Baseline snapshot for before/after comparison
    baseline_snapshot_v1 = Column(JSON, default=dict)  # original baseline at creation

    identity = relationship("Identity", back_populates="profile")
    history = relationship("BaselineHistory", back_populates="profile")

class BaselineHistory(Base):
    """Tracks each version of a behavioral profile for comparison."""
    __tablename__ = "baseline_history"

    id = Column(String, primary_key=True, index=True)
    identity_id = Column(String, ForeignKey("behavior_profiles.identity_id"), index=True)
    version = Column(Integer, nullable=False)
    resources = Column(JSON, default=list)
    actions = Column(JSON, default=list)
    average_request_rate = Column(Float, default=100.0)
    confidence = Column(Float, default=98.0)
    change_reason = Column(Text, default="")
    timestamp = Column(DateTime, default=datetime.utcnow)

    profile = relationship("BehaviorProfile", back_populates="history")

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    identity_id = Column(String, ForeignKey("identities.id"), index=True)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    request_rate = Column(Float, default=0.0)
    source = Column(String, default="internal-service")
    sensitivity = Column(String, default="medium")
    risk_score = Column(Float, default=0.0)
    trust_state = Column(String, default="NORMAL")
    explanation = Column(Text, default="")
    factors = Column(JSON, default=list)  # list of dicts with factor, score, reason

    identity = relationship("Identity", back_populates="events")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    identity_id = Column(String, ForeignKey("identities.id"), index=True)
    severity = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String, default="ACTIVE") # ACTIVE, ACKNOWLEDGED, RESOLVED

class BaselineChange(Base):
    __tablename__ = "baseline_changes"

    id = Column(String, primary_key=True, index=True)
    identity_id = Column(String, ForeignKey("identities.id"), index=True)
    change_type = Column(String, nullable=False) # NEW_RESOURCE, NEW_ACTION, RATE_DRIFT, SEQUENCE_CHANGE
    old_behavior = Column(Text, nullable=False)
    new_behavior = Column(Text, nullable=False)
    risk_score = Column(Float, default=0.0)
    decision = Column(String, default="PENDING") # APPROVED, REJECTED, PENDING, BLOCKED
    reason = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    identity = relationship("Identity", back_populates="baseline_changes")

class PoisoningState(Base):
    __tablename__ = "poisoning_states"

    identity_id = Column(String, ForeignKey("identities.id"), primary_key=True)
    suspicion_score = Column(Float, default=0.0) # 0 to 100
    gradual_drifts_count = Column(Integer, default=0)
    baseline_changes_attempted = Column(Integer, default=0)
    baseline_changes_approved = Column(Integer, default=0)
    baseline_changes_blocked = Column(Integer, default=0)
    attack_stage = Column(String, default="NORMAL") # NORMAL, SMALL_DRIFT, REPEATED_DRIFT, INCREASING_FREQUENCY, SUSPICIOUS, POISONING_DETECTED, BASELINE_PROTECTED
    last_evaluated = Column(DateTime, default=datetime.utcnow)

    identity = relationship("Identity", back_populates="poisoning_state")

class PredictionResult(Base):
    """Stores ML model predictions per event for the prediction feed."""
    __tablename__ = "prediction_results"

    id = Column(String, primary_key=True, index=True)
    identity_id = Column(String, ForeignKey("identities.id"), index=True)
    event_id = Column(String, index=True)
    statistical_risk_score = Column(Float, default=0.0)
    statistical_state = Column(String, default="NORMAL")
    ml_prediction = Column(String, default="NORMAL")
    ml_confidence = Column(Float, default=0.0)
    ml_probabilities = Column(JSON, default=dict)
    ml_reasons = Column(JSON, default=list)
    features = Column(JSON, default=dict)
    feature_importances = Column(JSON, default=dict)
    model_available = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    disclaimer = Column(String, default="Prototype / Synthetic Dataset")

    identity = relationship("Identity", back_populates="predictions")

class EvaluationResult(Base):
    """Stores results of automated evaluation runs."""
    __tablename__ = "evaluation_results"

    id = Column(String, primary_key=True, index=True)
    run_id = Column(String, index=True)  # groups results from same evaluation run
    scenario = Column(String, nullable=False)
    expected_state = Column(String, nullable=False)
    actual_state = Column(String, nullable=False)
    expected_baseline_decision = Column(String, default="NO_CHANGE")
    actual_baseline_decision = Column(String, default="NO_CHANGE")
    risk_score = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    explanation = Column(Text, default="")
    timestamp = Column(DateTime, default=datetime.utcnow)

class SlowBurnState(Base):
    __tablename__ = "slow_burn_states"

    identity_id = Column(String, ForeignKey("identities.id"), primary_key=True)
    cumulative_evidence_score = Column(Float, default=0.0) # 0 to 100
    cumulative_risk_score = Column(Float, default=10.0)    # 0 to 100
    observation_window = Column(Integer, default=0)        # 0 to 5
    evidence_count = Column(Integer, default=0)
    repeated_deviation_count = Column(Integer, default=0)
    persistence_score = Column(Float, default=0.0)
    resource_novelty_count = Column(Integer, default=0)
    action_novelty_count = Column(Integer, default=0)
    frequency_deviation_count = Column(Integer, default=0)
    sequence_deviation_count = Column(Integer, default=0)
    temporal_deviation_count = Column(Integer, default=0)
    sensitivity_events = Column(Integer, default=0)
    first_deviation_time = Column(DateTime, nullable=True)
    last_deviation_time = Column(DateTime, nullable=True)
    detection_time = Column(DateTime, nullable=True)
    previous_risk_score = Column(Float, default=10.0)
    current_trust_state = Column(String, default="NORMAL") # NORMAL, DRIFTING, SUSPICIOUS, HIGH-RISK
    baseline_decision = Column(String, default="NO_CHANGE") # NO_CHANGE, PENDING, APPROVED, BLOCKED
    trusted_baseline_status = Column(String, default="PROTECTED") # PROTECTED, UPDATED
    last_evaluated = Column(DateTime, default=datetime.utcnow)

    identity = relationship("Identity", back_populates="slow_burn_state")

class SlowBurnObservation(Base):
    __tablename__ = "slow_burn_observations"

    id = Column(String, primary_key=True, index=True)
    identity_id = Column(String, ForeignKey("identities.id"), index=True)
    window_number = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    instant_risk = Column(Float, default=0.0)
    cumulative_risk = Column(Float, default=0.0)
    evidence_score = Column(Float, default=0.0)
    trust_state = Column(String, default="NORMAL")
    deviation_type = Column(String, default="NORMAL")
    action = Column(String, default="READ")
    resource = Column(String, default="")
    explanation = Column(Text, default="")
    decision = Column(String, default="NO_CHANGE")
    evidence_breakdown = Column(JSON, default=dict)

    identity = relationship("Identity", back_populates="slow_burn_observations")
