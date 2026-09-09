import math
from datetime import datetime
from typing import Dict, Any, List, Tuple
from ..models.entities import BehaviorProfile, Event

SENSITIVITY_WEIGHTS = {
    "low": 0,
    "medium": 8,
    "high": 18,
    "critical": 28
}

HIGH_RISK_RESOURCES = {
    "vault_master_keys", "customer_pii_db", "payment_credentials", 
    "prod_root_certificates", "audit_log_archive"
}

HIGH_RISK_ACTIONS = {"DELETE", "ENCRYPT", "EXPORT", "DROP_TABLE", "EXFILTRATE"}

class BehavioralAnalyticsEngine:
    def __init__(self, thresholds: Dict[str, float] = None):
        self.thresholds = thresholds or {
            "normal_max": 29.0,
            "drifting_max": 54.0,
            "suspicious_max": 74.0,
        }

    def analyze_event(
        self, 
        event_data: Dict[str, Any], 
        profile: BehaviorProfile, 
        previous_event: Event = None
    ) -> Tuple[float, str, str, List[Dict[str, Any]]]:
        """
        Calculates explainable behavioral risk score (0-100), 
        trust state, explanation string, and list of risk factor breakdowns.
        """
        risk_score = 0.0
        factors = []
        reasons = []

        action = event_data.get("action", "READ")
        resource = event_data.get("resource", "unknown")
        req_rate = float(event_data.get("request_rate", profile.average_request_rate))
        timestamp = event_data.get("timestamp") or datetime.utcnow()
        source = event_data.get("source", "internal-service")
        sensitivity = event_data.get("sensitivity", "medium").lower()

        # 1. Resource Novelty Anomaly (0 - 25 pts)
        normal_resources = set(profile.normal_resources or [])
        if resource not in normal_resources:
            if resource in HIGH_RISK_RESOURCES:
                res_score = 25.0
                reason = f"Accessed unapproved critical resource: '{resource}'"
            elif sensitivity in ["high", "critical"]:
                res_score = 22.0
                reason = f"Novel high-sensitivity resource accessed: '{resource}'"
            else:
                res_score = 15.0
                reason = f"Novel resource detected: '{resource}' (not in baseline)"
            risk_score += res_score
            factors.append({"factor": "Resource Novelty", "score": res_score, "reason": reason})
            reasons.append(reason)

        # 2. Action Novelty Anomaly (0 - 25 pts)
        normal_actions = set(profile.normal_actions or [])
        if action not in normal_actions:
            if action in HIGH_RISK_ACTIONS:
                act_score = 25.0
                reason = f"High-risk action '{action}' executed (never seen in baseline)"
            else:
                act_score = 16.0
                reason = f"Unestablished action '{action}' performed"
            risk_score += act_score
            factors.append({"factor": "Action Novelty", "score": act_score, "reason": reason})
            reasons.append(reason)

        # 3. Frequency & Volume Deviation (0 - 20 pts)
        avg_rate = profile.average_request_rate or 100.0
        std_rate = max(profile.std_request_rate or 15.0, 5.0)
        z_score = (req_rate - avg_rate) / std_rate
        rate_ratio = req_rate / avg_rate if avg_rate > 0 else 1.0

        if z_score > 3.0 or rate_ratio > 3.0:
            freq_score = min(20.0, 10.0 + (z_score * 2.0))
            reason = f"Extreme request frequency spike: {rate_ratio:.1f}x baseline ({req_rate:.0f} req/min vs avg {avg_rate:.0f})"
            risk_score += freq_score
            factors.append({"factor": "Frequency Spike", "score": freq_score, "reason": reason})
            reasons.append(reason)
        elif z_score > 1.8 or rate_ratio > 1.8:
            freq_score = 10.0
            reason = f"Elevated request rate: {rate_ratio:.1f}x baseline (+{((rate_ratio-1)*100):.0f}%)"
            risk_score += freq_score
            factors.append({"factor": "Rate Deviation", "score": freq_score, "reason": reason})
            reasons.append(reason)

        # 4. Time-of-Day Anomaly (0 - 10 pts)
        hour = timestamp.hour if hasattr(timestamp, "hour") else 12
        start_h = profile.normal_hours_start if profile.normal_hours_start is not None else 8
        end_h = profile.normal_hours_end if profile.normal_hours_end is not None else 18
        
        # Check if outside normal working hours
        if start_h <= end_h:
            is_outside = not (start_h <= hour <= end_h)
        else: # wrap around midnight
            is_outside = not (hour >= start_h or hour <= end_h)

        if is_outside:
            time_score = 10.0
            reason = f"Activity at {hour:02d}:00 UTC outside normal operating window ({start_h:02d}:00 - {end_h:02d}:00 UTC)"
            risk_score += time_score
            factors.append({"factor": "Temporal Anomaly", "score": time_score, "reason": reason})
            reasons.append(reason)

        # 5. Sequence Anomaly (0 - 15 pts)
        if previous_event:
            prev_action = previous_event.action
            curr_sequence = [prev_action, action]
            common_sequences = profile.common_sequences or []
            if common_sequences and curr_sequence not in common_sequences:
                # Unusual sequence e.g. READ -> DELETE or READ -> EXPORT
                if action in HIGH_RISK_ACTIONS:
                    seq_score = 15.0
                    reason = f"Abnormal action sequence transition '{prev_action}' → '{action}'"
                else:
                    seq_score = 8.0
                    reason = f"Uncommon sequence pattern '{prev_action}' → '{action}'"
                risk_score += seq_score
                factors.append({"factor": "Sequence Anomaly", "score": seq_score, "reason": reason})
                reasons.append(reason)

        # 6. Sensitive Resource Impact (0 - 18 pts)
        sens_score = SENSITIVITY_WEIGHTS.get(sensitivity, 5)
        if sens_score > 0 and (resource not in normal_resources or action not in normal_actions):
            reason = f"Impact on high-sensitivity data classification ({sensitivity.upper()})"
            risk_score += sens_score
            factors.append({"factor": "Data Sensitivity", "score": sens_score, "reason": reason})
            reasons.append(reason)

        # 7. Context / Source Anomaly (0 - 15 pts)
        if source in ["tor-exit-node", "unknown-external-ip", "compromised-k8s-node"]:
            ctx_score = 15.0
            reason = f"High-risk network origin: {source}"
            risk_score += ctx_score
            factors.append({"factor": "Source Threat Context", "score": ctx_score, "reason": reason})
            reasons.append(reason)
        elif source == "external-vpn":
            ctx_score = 8.0
            reason = "Untrusted remote VPN ingress connection"
            risk_score += ctx_score
            factors.append({"factor": "External Gateway", "score": ctx_score, "reason": reason})
            reasons.append(reason)

        # Normalize final score to 0 - 100
        final_risk_score = round(min(100.0, max(0.0, risk_score)), 1)

        # Trust State Mapping
        if final_risk_score <= self.thresholds["normal_max"]:
            trust_state = "NORMAL"
        elif final_risk_score <= self.thresholds["drifting_max"]:
            trust_state = "DRIFTING"
        elif final_risk_score <= self.thresholds["suspicious_max"]:
            trust_state = "SUSPICIOUS"
        else:
            trust_state = "HIGH-RISK"

        # Construct explanation
        if not reasons:
            explanation = "Behavior aligns strictly with verified identity baseline (low variance)."
        else:
            explanation = "; ".join(reasons)

        return final_risk_score, trust_state, explanation, factors
