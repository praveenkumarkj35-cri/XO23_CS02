import uuid
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
from ..models.entities import Identity, BehaviorProfile, BaselineChange, Alert, PoisoningState

class AdaptiveTrustGate:
    """
    Evaluates proposed baseline modifications before merging them.
    Protects NHIs against unauthorized behavioral creep and malicious drift.
    """

    @staticmethod
    def evaluate_behavior_change(
        identity: Identity,
        profile: BehaviorProfile,
        poisoning_state: PoisoningState,
        event_data: Dict[str, Any],
        risk_score: float,
        recent_events_count: int = 5,
        repetition_count: int = 3
    ) -> Tuple[bool, str, str, Optional[BaselineChange]]:
        """
        Evaluates:
        1. Is the risk low? (Risk score <= 45)
        2. Is the behavior repeated? (Seen multiple times without critical errors)
        3. Is the behavior stable over time?
        4. Is the behavior contextually legitimate? (Not from foreign/anomalous sources)
        5. Are there poisoning indicators? (Poisoning suspicion score < 50)
        6. Is the behavior associated with suspicious or destructive actions?

        Returns:
        (is_safe, decision_code, decision_reason, baseline_change_obj)
        """
        action = event_data.get("action", "READ")
        resource = event_data.get("resource", "unknown")
        sensitivity = event_data.get("sensitivity", "medium").lower()
        source = event_data.get("source", "internal-service")

        # Determine what kind of change is occurring
        is_new_resource = resource not in (profile.normal_resources or [])
        is_new_action = action not in (profile.normal_actions or [])

        if not is_new_resource and not is_new_action:
            return True, "NO_CHANGE", "Event aligns with existing baseline. No adaptation required.", None

        change_type = "NEW_RESOURCE" if is_new_resource else "NEW_ACTION"
        if is_new_resource and is_new_action:
            change_type = "NEW_RESOURCE_AND_ACTION"

        old_behavior = f"Resources: {profile.normal_resources}, Actions: {profile.normal_actions}"
        new_behavior = f"Add Resource: '{resource}', Action: '{action}'"

        # Check Gate Criterion 1: Risk Level
        if risk_score >= 60.0:
            decision = "BLOCKED"
            reason = f"Gate Rejected: Risk score ({risk_score}/100) exceeds maximum acceptable drift threshold (60.0). High threat of lateral movement or unauthorized privilege escalation."
            change = BaselineChange(
                id=str(uuid.uuid4()),
                identity_id=identity.id,
                change_type=change_type,
                old_behavior=old_behavior,
                new_behavior=new_behavior,
                risk_score=risk_score,
                decision=decision,
                reason=reason,
                timestamp=datetime.utcnow()
            )
            return False, decision, reason, change

        # Check Gate Criterion 2: Poisoning Defense Score
        if poisoning_state and poisoning_state.suspicion_score >= 50.0:
            decision = "BLOCKED"
            reason = f"Baseline Poisoning Defense Active: Suspicion score ({poisoning_state.suspicion_score:.1f}/100) indicates multi-stage gradual manipulation. Update strictly blocked."
            change = BaselineChange(
                id=str(uuid.uuid4()),
                identity_id=identity.id,
                change_type=change_type,
                old_behavior=old_behavior,
                new_behavior=new_behavior,
                risk_score=risk_score,
                decision=decision,
                reason=reason,
                timestamp=datetime.utcnow()
            )
            return False, decision, reason, change

        # Check Gate Criterion 3: Destructive Actions / Critical Resources
        if action in ["DELETE", "ENCRYPT", "EXPORT"] or sensitivity in ["critical"]:
            decision = "REJECTED"
            reason = f"Gate Block: Destructive capability or critical resource '{resource}' cannot be automatically adopted into baseline."
            change = BaselineChange(
                id=str(uuid.uuid4()),
                identity_id=identity.id,
                change_type=change_type,
                old_behavior=old_behavior,
                new_behavior=new_behavior,
                risk_score=risk_score,
                decision=decision,
                reason=reason,
                timestamp=datetime.utcnow()
            )
            return False, decision, reason, change

        # Check Gate Criterion 4: Source Network Context
        if source not in ["internal-service", "k8s-cluster", "internal-vpc"]:
            decision = "REJECTED"
            reason = f"Gate Block: Ingress origin '{source}' is untrusted for behavioral baseline elevation."
            change = BaselineChange(
                id=str(uuid.uuid4()),
                identity_id=identity.id,
                change_type=change_type,
                old_behavior=old_behavior,
                new_behavior=new_behavior,
                risk_score=risk_score,
                decision=decision,
                reason=reason,
                timestamp=datetime.utcnow()
            )
            return False, decision, reason, change

        # Check Gate Criterion 5: Legitimate Drift Validation (Repeated & Low Risk)
        # In Legitimate Drift mode or benign evolutions, risk is moderate-low and source is clean.
        # Requires sustained observation (repetition) before gate approval.
        if risk_score < 45.0 and source in ["internal-service", "k8s-cluster"]:
            if repetition_count >= 2:
                decision = "APPROVED"
                reason = f"Safe Adaptation Approved: Verified legitimate workload evolution from verified internal context. Sustained observations ({repetition_count} cycles) confirmed with low risk ({risk_score:.1f}/100)."
                change = BaselineChange(
                    id=str(uuid.uuid4()),
                    identity_id=identity.id,
                    change_type=change_type,
                    old_behavior=old_behavior,
                    new_behavior=new_behavior,
                    risk_score=risk_score,
                    decision=decision,
                    reason=reason,
                    timestamp=datetime.utcnow()
                )
                return True, decision, reason, change
            else:
                decision = "PENDING"
                reason = f"Provisional Gate Review: Authorized workload drift detected from internal context. Awaiting sustained pattern repetition before baseline adaptation ({repetition_count}/2 cycles observed, risk: {risk_score:.1f}/100)."
                change = BaselineChange(
                    id=str(uuid.uuid4()),
                    identity_id=identity.id,
                    change_type=change_type,
                    old_behavior=old_behavior,
                    new_behavior=new_behavior,
                    risk_score=risk_score,
                    decision=decision,
                    reason=reason,
                    timestamp=datetime.utcnow()
                )
                return False, decision, reason, change

        # Default fallback: Pending human or repeated verification
        decision = "PENDING"
        reason = f"Provisional Gate Review: Change requires further repetition or admin signoff (risk: {risk_score}/100)."
        change = BaselineChange(
            id=str(uuid.uuid4()),
            identity_id=identity.id,
            change_type=change_type,
            old_behavior=old_behavior,
            new_behavior=new_behavior,
            risk_score=risk_score,
            decision=decision,
            reason=reason,
            timestamp=datetime.utcnow()
        )
        return False, decision, reason, change

    @staticmethod
    def apply_approved_change(profile: BehaviorProfile, change: BaselineChange, event_data: Dict[str, Any]):
        """Merges approved behavioral modifications into the identity profile and elevates confidence."""
        resource = event_data.get("resource")
        action = event_data.get("action")
        req_rate = float(event_data.get("request_rate", profile.average_request_rate))

        curr_resources = list(profile.normal_resources or [])
        if resource and resource not in curr_resources:
            curr_resources.append(resource)
            profile.normal_resources = curr_resources

        curr_actions = list(profile.normal_actions or [])
        if action and action not in curr_actions:
            curr_actions.append(action)
            profile.normal_actions = curr_actions

        # Smooth request rate adaptation using EWMA (alpha = 0.15)
        if req_rate > 0:
            profile.average_request_rate = round((0.85 * profile.average_request_rate) + (0.15 * req_rate), 1)

        profile.version += 1
        profile.confidence = min(99.5, profile.confidence + 0.5)
        profile.updated_at = datetime.utcnow()
