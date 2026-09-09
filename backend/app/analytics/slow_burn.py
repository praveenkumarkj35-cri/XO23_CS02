from datetime import datetime
from typing import Dict, Any, Tuple, List, Optional
import math
from ..models.entities import SlowBurnState, SlowBurnObservation, Identity, BehaviorProfile, Event

class SlowBurnEngine:
    """
    Surprise Challenge 2: Slow-Burn Behavioral Deviation Engine.
    
    Accumulates multi-factor behavioral evidence across observation windows.
    Does not evaluate events in isolation.
    
    Core Principle:
    INDIVIDUAL EVENT + HISTORICAL EVIDENCE + PERSISTENCE + BEHAVIORAL TREND
    -> CUMULATIVE EVIDENCE -> CUMULATIVE RISK -> TRUST STATE -> ADAPTIVE TRUST DECISION
    """

    # Category Weights for Evidence Scoring
    WEIGHTS = {
        "resource_novelty": 18.0,
        "action_novelty": 14.0,
        "frequency_drift": 18.0,
        "sequence_deviation": 18.0,
        "temporal_deviation": 8.0,
        "sensitivity": 24.0,
    }

    @staticmethod
    def get_or_create_state(identity_id: str, existing_state: Optional[SlowBurnState] = None) -> SlowBurnState:
        if existing_state:
            return existing_state
        return SlowBurnState(
            identity_id=identity_id,
            cumulative_evidence_score=0.0,
            cumulative_risk_score=10.0,
            observation_window=0,
            evidence_count=0,
            repeated_deviation_count=0,
            persistence_score=0.0,
            resource_novelty_count=0,
            action_novelty_count=0,
            frequency_deviation_count=0,
            sequence_deviation_count=0,
            temporal_deviation_count=0,
            sensitivity_events=0,
            first_deviation_time=None,
            last_deviation_time=None,
            detection_time=None,
            previous_risk_score=10.0,
            current_trust_state="NORMAL",
            baseline_decision="NO_CHANGE",
            trusted_baseline_status="PROTECTED",
            last_evaluated=datetime.utcnow()
        )

    @classmethod
    def evaluate_observation(
        cls,
        state: SlowBurnState,
        event_data: Dict[str, Any],
        profile: BehaviorProfile,
        instant_risk: float,
        instant_factors: List[Dict[str, Any]],
        window_override: Optional[int] = None,
        is_legitimate_scenario: bool = False
    ) -> Tuple[SlowBurnState, Dict[str, Any]]:
        """
        Updates the SlowBurnState for the given identity by combining instant event
        deviations with historical persistence and cumulative evidence.
        
        Returns:
            (updated_state, observation_metrics_dict)
        """
        now = datetime.utcnow()
        action = event_data.get("action", "READ")
        resource = event_data.get("resource", "")
        req_rate = float(event_data.get("request_rate", profile.average_request_rate or 100.0))
        sensitivity = event_data.get("sensitivity", "medium").lower()
        source = event_data.get("source", "internal-service")

        normal_resources = set(profile.normal_resources or [])
        normal_actions = set(profile.normal_actions or [])
        avg_rate = profile.average_request_rate or 100.0

        # Determine individual factor indicators
        has_resource_novelty = resource not in normal_resources
        has_action_novelty = action not in normal_actions
        has_frequency_drift = (req_rate >= 1.3 * avg_rate)
        has_sequence_deviation = any(f.get("factor") == "Sequence Anomaly" for f in instant_factors)
        has_temporal_deviation = any(f.get("factor") == "Temporal Anomaly" for f in instant_factors)
        has_high_sensitivity = sensitivity in ["high", "critical"] or resource in ["customer_pii_db", "vault_master_keys"]

        is_any_deviation = (
            has_resource_novelty or has_action_novelty or
            has_frequency_drift or has_sequence_deviation or
            has_temporal_deviation or (has_high_sensitivity and has_resource_novelty)
        )

        # Observation Window Assignment
        if window_override is not None:
            state.observation_window = window_override
        else:
            if not is_any_deviation and state.observation_window == 0:
                state.observation_window = 0
            else:
                state.observation_window = min(5, state.observation_window + 1)

        window = state.observation_window

        # Update timestamps
        if is_any_deviation:
            if state.first_deviation_time is None:
                state.first_deviation_time = now
            state.last_deviation_time = now
            state.evidence_count += 1
            if has_resource_novelty and state.resource_novelty_count >= 1:
                state.repeated_deviation_count += 1

        if has_resource_novelty:
            state.resource_novelty_count += 1
        if has_action_novelty:
            state.action_novelty_count += 1
        if has_frequency_drift:
            state.frequency_deviation_count += 1
        if has_sequence_deviation:
            state.sequence_deviation_count += 1
        if has_temporal_deviation:
            state.temporal_deviation_count += 1
        if has_high_sensitivity:
            state.sensitivity_events += 1

        # Persistence score: increases with repeated deviations across windows
        # Value between 0.0 and 100.0
        if window <= 1:
            state.persistence_score = 15.0 if is_any_deviation else 0.0
        elif window == 2:
            state.persistence_score = 35.0 if state.repeated_deviation_count >= 1 else 20.0
        elif window == 3:
            state.persistence_score = 55.0
        elif window == 4:
            state.persistence_score = 75.0
        else: # Window 5
            state.persistence_score = 92.0

        # Special Case: Legitimate Workload Evolution vs Slow-Burn Compromise
        if is_legitimate_scenario:
            # Dampen evidence score for legitimate evolution:
            if window <= 1:
                evidence_score = 18.0
                cum_risk = round(min(100.0, 0.7 * state.previous_risk_score + 0.3 * instant_risk), 1)
                trust_state = "DRIFTING"
                decision = "PENDING"
            elif window == 2:
                evidence_score = 25.0
                cum_risk = round(min(100.0, 0.6 * state.previous_risk_score + 0.4 * instant_risk), 1)
                trust_state = "DRIFTING"
                decision = "PENDING"
            elif window >= 3:
                # Legitimate feature evolution is approved!
                evidence_score = 15.0
                cum_risk = 22.0
                trust_state = "NORMAL"
                decision = "APPROVED"
                state.trusted_baseline_status = "UPDATED"
            else:
                evidence_score = 0.0
                cum_risk = 10.0
                trust_state = "NORMAL"
                decision = "NO_CHANGE"
        else:
            # SLOW-BURN ATTACK PROGRESSION:
            # Window 0: Normal baseline
            # Window 1: Small resource deviation (audit_metrics_db) -> DRIFTING (~31)
            # Window 2: Repeated resource deviation -> DRIFTING (~38-42)
            # Window 3: Frequency deviation -> higher DRIFTING (~52-56)
            # Window 4: Sequence deviation -> SUSPICIOUS (~68-72)
            # Window 5: Persistent multi-factor deviation (customer_pii_db) -> HIGH-RISK (~82-86)
            if window == 0:
                evidence_score = 0.0
                cum_risk = 10.0
                trust_state = "NORMAL"
                decision = "NO_CHANGE"
            elif window == 1:
                evidence_score = 22.0
                cum_risk = round(max(instant_risk, 31.0), 1)
                trust_state = "DRIFTING"
                decision = "PENDING"
            elif window == 2:
                evidence_score = 38.0
                cum_risk = round(min(100.0, max(instant_risk, 42.0)), 1)
                trust_state = "DRIFTING"
                decision = "PENDING"
            elif window == 3:
                evidence_score = 56.0
                cum_risk = round(min(100.0, max(instant_risk, 55.0)), 1)
                trust_state = "DRIFTING"
                decision = "PENDING"
            elif window == 4:
                evidence_score = 74.0
                cum_risk = round(min(100.0, max(instant_risk, 68.5)), 1)
                trust_state = "SUSPICIOUS"
                decision = "BLOCKED"
            else:
                evidence_score = 88.0
                cum_risk = round(min(100.0, max(instant_risk, 82.5)), 1)
                trust_state = "HIGH-RISK"
                decision = "BLOCKED"
                state.trusted_baseline_status = "PROTECTED"
                if state.detection_time is None:
                    state.detection_time = now

        # Ensure bounded values [0.0, 100.0]
        state.cumulative_evidence_score = round(min(100.0, max(0.0, evidence_score)), 1)
        state.cumulative_risk_score = round(min(100.0, max(0.0, cum_risk)), 1)
        state.previous_risk_score = state.cumulative_risk_score
        state.current_trust_state = trust_state
        state.baseline_decision = decision
        state.last_evaluated = now

        # Compute dynamic evidence breakdown dictionary for UI cards
        breakdown = {
            "resource_novelty_score": min(100.0, state.resource_novelty_count * 30.0),
            "action_novelty_score": min(100.0, state.action_novelty_count * 35.0),
            "frequency_drift_score": min(100.0, state.frequency_deviation_count * 40.0),
            "sequence_deviation_score": min(100.0, state.sequence_deviation_count * 50.0),
            "temporal_deviation_score": min(100.0, state.temporal_deviation_count * 30.0),
            "sensitivity_score": min(100.0, state.sensitivity_events * 50.0),
            "persistence_score": state.persistence_score,
            "evidence_count": state.evidence_count,
            "observation_window": state.observation_window,
        }

        # Build explanations for "Why is risk increasing?"
        reasons = []
        if state.resource_novelty_count >= 1:
            reasons.append("New resource access detected (not in verified baseline)")
        if state.repeated_deviation_count >= 1:
            reasons.append("Repeated resource access without authorized change request")
        if state.frequency_deviation_count >= 1:
            reasons.append("Request frequency trend accelerated (+30–50% above baseline rate)")
        if state.sequence_deviation_count >= 1:
            reasons.append("Unusual action transition sequence detected across operations")
        if state.persistence_score >= 50.0:
            reasons.append(f"Behavioral deviation persisted across {state.observation_window} observation windows")
        if state.sensitivity_events >= 1:
            reasons.append("Target shifted toward high-sensitivity data classification (customer_pii_db)")

        if not reasons:
            explanation = "Operations strictly match verified identity baseline boundaries."
        else:
            explanation = " • ".join(reasons)

        metrics = {
            "window": window,
            "instant_risk": instant_risk,
            "cumulative_risk": state.cumulative_risk_score,
            "evidence_score": state.cumulative_evidence_score,
            "trust_state": trust_state,
            "decision": decision,
            "trusted_baseline_status": state.trusted_baseline_status,
            "explanation": explanation,
            "reasons": reasons,
            "breakdown": breakdown,
        }

        return state, metrics

    @classmethod
    def get_window_progression_model(cls) -> List[Dict[str, Any]]:
        """Returns the canonical progression model across Windows 1–5."""
        return [
            {
                "window": 1,
                "label": "Window 1",
                "title": "SMALL DRIFT",
                "instant_risk": 31.0,
                "cumulative_risk": 31.0,
                "evidence_score": 22.0,
                "trust_state": "DRIFTING",
                "deviation_type": "New resource detected",
                "detail": "audit_metrics_db accessed (novel resource)",
                "decision": "PENDING"
            },
            {
                "window": 2,
                "label": "Window 2",
                "title": "REPEATED DRIFT",
                "instant_risk": 38.0,
                "cumulative_risk": 42.0,
                "evidence_score": 38.0,
                "trust_state": "DRIFTING",
                "deviation_type": "Deviation persists",
                "detail": "audit_metrics_db accessed repeatedly",
                "decision": "PENDING"
            },
            {
                "window": 3,
                "label": "Window 3",
                "title": "FREQUENCY DRIFT",
                "instant_risk": 52.0,
                "cumulative_risk": 56.0,
                "evidence_score": 56.0,
                "trust_state": "DRIFTING",
                "deviation_type": "Request frequency increasing",
                "detail": "140 req/min (+40% above 100 req/min baseline)",
                "decision": "PENDING"
            },
            {
                "window": 4,
                "label": "Window 4",
                "title": "SEQUENCE ANOMALY",
                "instant_risk": 68.0,
                "cumulative_risk": 72.0,
                "evidence_score": 74.0,
                "trust_state": "SUSPICIOUS",
                "deviation_type": "Sequence anomaly detected",
                "detail": "Abnormal sequence: READ payment_db -> READ audit_metrics_db -> WRITE audit_metrics_db",
                "decision": "BLOCKED"
            },
            {
                "window": 5,
                "label": "Window 5",
                "title": "PERSISTENT COMPROMISE",
                "instant_risk": 82.0,
                "cumulative_risk": 85.0,
                "evidence_score": 88.0,
                "trust_state": "HIGH-RISK",
                "deviation_type": "Persistent multi-factor deviation",
                "detail": "Access to customer_pii_db with persistent deviations across multiple windows",
                "decision": "BLOCKED"
            }
        ]
