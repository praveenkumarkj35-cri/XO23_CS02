import asyncio
import random
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

from ..database import SessionLocal
from ..models.entities import (
    Identity, BehaviorProfile, Event, Alert, 
    BaselineChange, PoisoningState, PredictionResult,
    BaselineHistory, EvaluationResult, SlowBurnState, SlowBurnObservation
)
from ..analytics.engine import BehavioralAnalyticsEngine
from ..analytics.trust_gate import AdaptiveTrustGate
from ..analytics.poisoning import BaselinePoisoningDefense
from ..analytics.slow_burn import SlowBurnEngine
from ml.predictor import extract_features, predict

class SimulationCoordinator:
    def __init__(self):
        self.is_running = False
        self.current_scenario = "idle"
        self.target_identity_id = "payment-service"
        self.step_index = 0
        self.speed_seconds = 1.6
        self._task: Optional[asyncio.Task] = None
        self.broadcast_callback = None
        self.engine = BehavioralAnalyticsEngine()
        # Slow-burn specific state
        self.slow_burn_window = 0   # current observation window (0-5)
        self.slow_burn_running = False
        self._slow_burn_task: Optional[asyncio.Task] = None

    def set_broadcaster(self, callback):
        self.broadcast_callback = callback

    def start(self, scenario: str = "normal", identity_id: str = "payment-service", speed_ms: int = 1600):
        self.current_scenario = scenario
        self.target_identity_id = identity_id
        self.speed_seconds = max(0.6, speed_ms / 1000.0)
        self.step_index = 0
        self.is_running = True

        if self._task and not self._task.done():
            self._task.cancel()

        self._task = asyncio.create_task(self._run_loop())

    def stop(self):
        self.is_running = False
        self.current_scenario = "idle"
        if self._task and not self._task.done():
            self._task.cancel()

    async def execute_judge_demo_step(self, step: int) -> Dict[str, Any]:
        """Executes a single specific step (1-8) of the Judge Demo suite."""
        if self._task and not self._task.done():
            self._task.cancel()
        self.is_running = False
        self.current_scenario = "judge_demo"

        if step == 1 and self.step_index != 0:
            self.reset()
            self.current_scenario = "judge_demo"

        self.step_index = max(0, step - 1)
        payload = await self.generate_step(forced_scenario="judge_demo")
        return payload

    def reset(self):
        self.stop()
        self.step_index = 0
        self.slow_burn_window = 0
        self.slow_burn_running = False
        db = SessionLocal()
        try:
            # Reset identities to initial states
            identities = db.query(Identity).all()
            for idn in identities:
                idn.current_state = "NORMAL"
                idn.trust_score = 96.0
                idn.risk_score = 5.0
                idn.baseline_confidence = 98.0

            # Reset poisoning states
            poisoning_states = db.query(PoisoningState).all()
            for p in poisoning_states:
                p.suspicion_score = 0.0
                p.gradual_drifts_count = 0
                p.baseline_changes_attempted = 0
                p.baseline_changes_approved = 0
                p.baseline_changes_blocked = 0
                p.attack_stage = "NORMAL"

            # Reset slow burn states
            sb_states = db.query(SlowBurnState).all()
            for s in sb_states:
                s.cumulative_evidence_score = 0.0
                s.cumulative_risk_score = 10.0
                s.observation_window = 0
                s.evidence_count = 0
                s.repeated_deviation_count = 0
                s.persistence_score = 0.0
                s.resource_novelty_count = 0
                s.action_novelty_count = 0
                s.frequency_deviation_count = 0
                s.sequence_deviation_count = 0
                s.temporal_deviation_count = 0
                s.sensitivity_events = 0
                s.first_deviation_time = None
                s.last_deviation_time = None
                s.detection_time = None
                s.previous_risk_score = 10.0
                s.current_trust_state = "NORMAL"
                s.baseline_decision = "NO_CHANGE"
                s.trusted_baseline_status = "PROTECTED"

            # Reset payment-service profile back to original default
            pay_prof = db.query(BehaviorProfile).filter(BehaviorProfile.identity_id == "payment-service").first()
            if pay_prof:
                pay_prof.normal_resources = ["payment_db", "payment_gateway_api", "transaction_ledger"]
                pay_prof.normal_actions = ["READ", "WRITE", "VERIFY"]
                pay_prof.average_request_rate = 100.0
                pay_prof.confidence = 98.4
                pay_prof.version = 1
                pay_prof.baseline_snapshot_v1 = {
                    "version": 1,
                    "normal_resources": ["payment_db", "payment_gateway_api", "transaction_ledger"],
                    "normal_actions": ["READ", "WRITE", "VERIFY"],
                    "average_request_rate": 100.0,
                    "confidence": 98.4,
                }

            db.commit()
        finally:
            db.close()

    # ============================================================
    # SLOW-BURN SIMULATION METHODS
    # ============================================================

    def start_slow_burn(self, identity_id: str = "payment-service", speed_ms: int = 2200):
        """Start automated slow-burn simulation cycling through Windows 1-5."""
        self.target_identity_id = identity_id
        self.speed_seconds = max(1.0, speed_ms / 1000.0)
        self.slow_burn_running = True
        self.slow_burn_window = 0

        if self._slow_burn_task and not self._slow_burn_task.done():
            self._slow_burn_task.cancel()

        self._slow_burn_task = asyncio.create_task(self._run_slow_burn_loop())

    def stop_slow_burn(self):
        """Stop the slow-burn simulation."""
        self.slow_burn_running = False
        if self._slow_burn_task and not self._slow_burn_task.done():
            self._slow_burn_task.cancel()

    async def _run_slow_burn_loop(self):
        """Automated loop: advances window every tick until Window 5."""
        try:
            while self.slow_burn_running and self.slow_burn_window <= 5:
                await self.execute_slow_burn_window(self.slow_burn_window)
                if self.slow_burn_window >= 5:
                    self.slow_burn_running = False
                    break
                self.slow_burn_window += 1
                await asyncio.sleep(self.speed_seconds)
        except asyncio.CancelledError:
            pass

    async def execute_slow_burn_window(self, window: int, is_legitimate: bool = False) -> Dict[str, Any]:
        """Execute one observation window of the slow-burn simulation and return full payload."""
        self.slow_burn_window = window
        db = SessionLocal()
        try:
            identity = db.query(Identity).filter(Identity.id == self.target_identity_id).first()
            if not identity:
                identity = db.query(Identity).first()
                self.target_identity_id = identity.id

            profile = db.query(BehaviorProfile).filter(BehaviorProfile.identity_id == identity.id).first()
            slow_burn_state = db.query(SlowBurnState).filter(SlowBurnState.identity_id == identity.id).first()
            if not slow_burn_state:
                slow_burn_state = SlowBurnEngine.get_or_create_state(identity.id, None)
                db.add(slow_burn_state)
            
            prev_event = db.query(Event).filter(Event.identity_id == identity.id).order_by(Event.timestamp.desc()).first()
            poisoning_state = db.query(PoisoningState).filter(PoisoningState.identity_id == identity.id).first()

            # Craft the slow-burn event for this window
            event_data = self._craft_slow_burn_event(window, profile, is_legitimate)
            now = datetime.utcnow()
            event_data["timestamp"] = now

            # 1. Instant risk via Behavioral Analytics Engine
            instant_risk, trust_state_instant, explanation, factors = self.engine.analyze_event(
                event_data=event_data, profile=profile, previous_event=prev_event
            )

            # 2. Slow-Burn Cumulative Evidence Evaluation
            updated_sb_state, sb_metrics = SlowBurnEngine.evaluate_observation(
                state=slow_burn_state,
                event_data=event_data,
                profile=profile,
                instant_risk=instant_risk,
                instant_factors=factors,
                window_override=window,
                is_legitimate_scenario=is_legitimate
            )

            # 3. Merge trust state from slow-burn engine (cumulative takes precedence)
            cumulative_trust_state = updated_sb_state.current_trust_state
            cumulative_risk = updated_sb_state.cumulative_risk_score
            evidence_score = updated_sb_state.cumulative_evidence_score
            baseline_decision = updated_sb_state.baseline_decision

            # 4. Update identity state using cumulative risk for final trust decision
            new_trust = max(5.0, min(99.0, 100.0 - (cumulative_risk * 0.92)))
            identity.trust_score = round(0.7 * identity.trust_score + 0.3 * new_trust, 1)
            identity.risk_score = cumulative_risk
            identity.current_state = cumulative_trust_state
            identity.last_seen = now

            # 5. Persist the event
            evt_id = str(uuid.uuid4())
            new_event = Event(
                id=evt_id,
                identity_id=identity.id,
                action=event_data["action"],
                resource=event_data["resource"],
                timestamp=now,
                request_rate=event_data["request_rate"],
                source=event_data["source"],
                sensitivity=event_data["sensitivity"],
                risk_score=cumulative_risk,
                trust_state=cumulative_trust_state,
                explanation=sb_metrics["explanation"],
                factors=factors
            )
            db.add(new_event)

            # 6. Persist SlowBurnObservation for this window
            obs = SlowBurnObservation(
                id=str(uuid.uuid4()),
                identity_id=identity.id,
                window_number=window,
                timestamp=now,
                instant_risk=instant_risk,
                cumulative_risk=cumulative_risk,
                evidence_score=evidence_score,
                trust_state=cumulative_trust_state,
                deviation_type=sb_metrics.get("breakdown", {}).get("deviation_type", "NORMAL"),
                action=event_data["action"],
                resource=event_data["resource"],
                explanation=sb_metrics["explanation"],
                decision=baseline_decision,
                evidence_breakdown=sb_metrics.get("breakdown", {})
            )
            db.add(obs)

            # 7. Generate alert if suspicious or high-risk
            new_alert = None
            if cumulative_trust_state in ["SUSPICIOUS", "HIGH-RISK"] or cumulative_risk >= 60.0:
                severity = "CRITICAL" if cumulative_risk >= 75.0 else "HIGH"
                title = f"Slow-Burn Detection: {cumulative_trust_state} on {identity.name}"
                if window == 5:
                    title = f"Slow-Burn BLOCKED: Trusted Baseline Protected on {identity.name}"
                new_alert = Alert(
                    id=str(uuid.uuid4()),
                    identity_id=identity.id,
                    severity=severity,
                    title=title,
                    description=sb_metrics["explanation"],
                    timestamp=now,
                    status="ACTIVE"
                )
                db.add(new_alert)

            db.commit()

            # 8. Build WebSocket payload
            ws_payload = {
                "type": "SLOW_BURN_UPDATE",
                "scenario": "slow_burn" if not is_legitimate else "legitimate_drift",
                "step_index": window,
                "event": {
                    "id": evt_id,
                    "identity_id": identity.id,
                    "identity_name": identity.name,
                    "action": event_data["action"],
                    "resource": event_data["resource"],
                    "timestamp": now.isoformat(),
                    "request_rate": event_data["request_rate"],
                    "source": event_data["source"],
                    "sensitivity": event_data["sensitivity"],
                    "risk_score": cumulative_risk,
                    "trust_state": cumulative_trust_state,
                    "explanation": sb_metrics["explanation"],
                    "factors": factors
                },
                "identity": {
                    "id": identity.id,
                    "name": identity.name,
                    "current_state": identity.current_state,
                    "trust_score": identity.trust_score,
                    "risk_score": identity.risk_score,
                    "baseline_confidence": identity.baseline_confidence
                },
                "slow_burn": {
                    "observation_window": window,
                    "total_windows": 5,
                    "instant_risk": round(instant_risk, 1),
                    "cumulative_risk": cumulative_risk,
                    "evidence_score": evidence_score,
                    "trust_state": cumulative_trust_state,
                    "baseline_decision": baseline_decision,
                    "trusted_baseline_status": updated_sb_state.trusted_baseline_status,
                    "explanation": sb_metrics["explanation"],
                    "reasons": sb_metrics.get("reasons", []),
                    "breakdown": sb_metrics.get("breakdown", {}),
                    "evidence_count": updated_sb_state.evidence_count,
                    "repeated_deviation_count": updated_sb_state.repeated_deviation_count,
                    "persistence_score": updated_sb_state.persistence_score,
                    "resource_novelty_count": updated_sb_state.resource_novelty_count,
                    "action_novelty_count": updated_sb_state.action_novelty_count,
                    "frequency_deviation_count": updated_sb_state.frequency_deviation_count,
                    "sequence_deviation_count": updated_sb_state.sequence_deviation_count,
                    "sensitivity_events": updated_sb_state.sensitivity_events,
                },
                "alert": {
                    "id": new_alert.id,
                    "severity": new_alert.severity,
                    "title": new_alert.title,
                    "description": new_alert.description,
                    "timestamp": new_alert.timestamp.isoformat()
                } if new_alert else None,
            }

            if self.broadcast_callback:
                await self.broadcast_callback(ws_payload)

            return ws_payload

        finally:
            db.close()

    async def _run_loop(self):
        try:
            while self.is_running:
                await self.generate_step()
                if self.current_scenario == "judge_demo" and self.step_index >= 8:
                    # Judge demo completes after 8 distinct showcase steps
                    self.stop()
                    break
                await asyncio.sleep(self.speed_seconds)
        except asyncio.CancelledError:
            pass

    async def generate_step(self, forced_scenario: Optional[str] = None):
        scenario = forced_scenario or self.current_scenario
        self.step_index += 1

        # Handle Judge Demo step mapping
        effective_scenario = scenario
        judge_step_info = None
        if scenario == "judge_demo":
            judge_steps = {
                1: ("normal", 1, "Baseline Operation", "Normal steady-state behavioral profile with verified baseline"),
                2: ("drift", 1, "Legitimate Drift Intro", "Authorized workload shift introducing audit_metrics_db"),
                3: ("drift", 2, "Legitimate Drift Sustained", "Telemetry activity observed with low risk and steady velocity"),
                4: ("drift", 3, "Adaptive Gate Approval", "Legitimate change approved into Baseline v2 automatically"),
                5: ("attack", 1, "Sudden Attack Blocked", "Unapproved credential exfiltration immediately blocked by Trust Gate"),
                6: ("poisoning", 2, "Poisoning Step 1 (Subtle)", "Adversary introduces low-profile log_exporter_v2 resource"),
                7: ("poisoning", 4, "Poisoning Step 2 (Frequency)", "Increasing query frequency triggers cumulative suspicion counter"),
                8: ("poisoning", 7, "Poisoning Defense Locked", "Boiling-frog attack blocked, baseline protected from corruption"),
            }
            mapped_step = min(self.step_index, 8)
            eff_scen, eff_step, title, desc = judge_steps.get(mapped_step, ("normal", 1, "Demo Finished", "Demo complete"))
            effective_scenario = eff_scen
            craft_step = eff_step
            judge_step_info = {
                "step": mapped_step,
                "total_steps": 8,
                "title": title,
                "description": desc,
                "is_complete": (mapped_step >= 8),
            }
        else:
            craft_step = self.step_index

        db = SessionLocal()
        try:
            identity = db.query(Identity).filter(Identity.id == self.target_identity_id).first()
            if not identity:
                identity = db.query(Identity).first()
                self.target_identity_id = identity.id

            profile = db.query(BehaviorProfile).filter(BehaviorProfile.identity_id == identity.id).first()
            if profile and not profile.baseline_snapshot_v1:
                profile.baseline_snapshot_v1 = {
                    "version": profile.version or 1,
                    "normal_resources": list(profile.normal_resources or []),
                    "normal_actions": list(profile.normal_actions or []),
                    "average_request_rate": profile.average_request_rate or 100.0,
                    "confidence": profile.confidence or 98.0,
                }

            poisoning_state = db.query(PoisoningState).filter(PoisoningState.identity_id == identity.id).first()
            prev_event = db.query(Event).filter(Event.identity_id == identity.id).order_by(Event.timestamp.desc()).first()

            event_data = self._craft_event(effective_scenario, identity, profile, craft_step)
            now = datetime.utcnow()
            event_data["timestamp"] = now

            # 1. Behavioral Analytics
            risk_score, trust_state, explanation, factors = self.engine.analyze_event(
                event_data=event_data,
                profile=profile,
                previous_event=prev_event
            )

            # Check novelty
            is_novel = (
                event_data["resource"] not in (profile.normal_resources or []) or
                event_data["action"] not in (profile.normal_actions or [])
            )

            # 2. ML Prediction Layer
            features = extract_features(
                event_data=event_data,
                profile_avg_rate=profile.average_request_rate or 100.0,
                profile_normal_resources=profile.normal_resources or [],
                profile_normal_actions=profile.normal_actions or [],
                risk_score=risk_score,
                factors=factors,
                is_novel=is_novel,
            )
            ml_result = predict(
                features=features,
                statistical_risk=risk_score,
                statistical_state=trust_state,
            )

            # 3. Poisoning Defense Evaluation
            updated_poisoning, is_poisoning_locked = BaselinePoisoningDefense.evaluate_poisoning_step(
                poisoning_state=poisoning_state,
                identity=identity,
                event_data=event_data,
                risk_score=risk_score,
                is_novel=is_novel
            )

            # 4. Adaptive Trust Gate Evaluation
            repetition_count = 1
            if scenario == "judge_demo":
                if mapped_step == 4:
                    repetition_count = 2
                else:
                    repetition_count = 1
            else:
                repetition_count = db.query(Event).filter(
                    Event.identity_id == identity.id,
                    Event.resource == event_data["resource"]
                ).count()

            is_safe, decision, decision_reason, baseline_change = AdaptiveTrustGate.evaluate_behavior_change(
                identity=identity,
                profile=profile,
                poisoning_state=updated_poisoning,
                event_data=event_data,
                risk_score=risk_score,
                repetition_count=repetition_count
            )

            if baseline_change:
                if decision == "APPROVED":
                    updated_poisoning.baseline_changes_approved += 1
                    # Merge approved adaptation into baseline!
                    AdaptiveTrustGate.apply_approved_change(profile, baseline_change, event_data)
                    # Snapshot into BaselineHistory
                    history_entry = BaselineHistory(
                        id=str(uuid.uuid4()),
                        identity_id=identity.id,
                        version=profile.version,
                        resources=list(profile.normal_resources or []),
                        actions=list(profile.normal_actions or []),
                        average_request_rate=profile.average_request_rate,
                        confidence=profile.confidence,
                        change_reason=baseline_change.reason,
                        timestamp=now
                    )
                    db.add(history_entry)
                elif decision in ["BLOCKED", "REJECTED"]:
                    updated_poisoning.baseline_changes_blocked += 1
                db.add(baseline_change)

            # If poisoning locked, mark attack stage as BASELINE_PROTECTED when blocked
            if is_poisoning_locked and decision == "BLOCKED":
                updated_poisoning.attack_stage = "BASELINE_PROTECTED"

            # 5. Update Identity Trust Score and State
            new_trust = max(5.0, min(99.0, 100.0 - (risk_score * 0.92)))
            identity.trust_score = round(0.7 * identity.trust_score + 0.3 * new_trust, 1)
            identity.risk_score = risk_score
            identity.current_state = trust_state
            identity.last_seen = now

            # 6. Persist Event
            evt_id = str(uuid.uuid4())
            new_event = Event(
                id=evt_id,
                identity_id=identity.id,
                action=event_data["action"],
                resource=event_data["resource"],
                timestamp=now,
                request_rate=event_data["request_rate"],
                source=event_data["source"],
                sensitivity=event_data["sensitivity"],
                risk_score=risk_score,
                trust_state=trust_state,
                explanation=explanation,
                factors=factors
            )
            db.add(new_event)

            # 7. Persist ML Prediction
            pred_id = str(uuid.uuid4())
            pred_record = PredictionResult(
                id=pred_id,
                identity_id=identity.id,
                event_id=evt_id,
                statistical_risk_score=risk_score,
                statistical_state=trust_state,
                ml_prediction=ml_result["prediction"],
                ml_confidence=ml_result["confidence"],
                ml_probabilities=ml_result.get("probabilities", {}),
                ml_reasons=ml_result.get("reasons", []),
                features=ml_result.get("features", {}),
                feature_importances=ml_result.get("feature_importances", {}),
                model_available=ml_result.get("model_available", True),
                timestamp=now,
                disclaimer=ml_result.get("disclaimer", "Prototype / Synthetic Dataset")
            )
            db.add(pred_record)

            # 8. Generate Alert if suspicious or high risk
            new_alert = None
            if risk_score >= 55.0 or trust_state in ["SUSPICIOUS", "HIGH-RISK"] or is_poisoning_locked:
                severity = "CRITICAL" if risk_score >= 75.0 or is_poisoning_locked else "HIGH"
                title = f"Behavioral Anomaly: {trust_state} state detected on {identity.name}"
                if is_poisoning_locked:
                    title = f"Baseline Poisoning Defense: Attack Blocked on {identity.name}"

                new_alert = Alert(
                    id=str(uuid.uuid4()),
                    identity_id=identity.id,
                    severity=severity,
                    title=title,
                    description=explanation,
                    timestamp=now,
                    status="ACTIVE"
                )
                db.add(new_alert)

            db.commit()

            # 9. Construct WebSocket Payload
            ws_payload = {
                "type": "LIVE_UPDATE",
                "scenario": scenario,
                "step_index": self.step_index,
                "judge_demo": judge_step_info,
                "event": {
                    "id": evt_id,
                    "identity_id": identity.id,
                    "identity_name": identity.name,
                    "action": event_data["action"],
                    "resource": event_data["resource"],
                    "timestamp": now.isoformat(),
                    "request_rate": event_data["request_rate"],
                    "source": event_data["source"],
                    "sensitivity": event_data["sensitivity"],
                    "risk_score": risk_score,
                    "trust_state": trust_state,
                    "explanation": explanation,
                    "factors": factors
                },
                "identity": {
                    "id": identity.id,
                    "name": identity.name,
                    "current_state": identity.current_state,
                    "trust_score": identity.trust_score,
                    "risk_score": identity.risk_score,
                    "baseline_confidence": identity.baseline_confidence
                },
                "baseline_change": {
                    "id": baseline_change.id,
                    "change_type": baseline_change.change_type,
                    "decision": baseline_change.decision,
                    "reason": baseline_change.reason,
                    "risk_score": baseline_change.risk_score,
                    "timestamp": baseline_change.timestamp.isoformat()
                } if baseline_change else None,
                "baseline_snapshot": {
                    "version": profile.version,
                    "normal_resources": profile.normal_resources,
                    "normal_actions": profile.normal_actions,
                    "average_request_rate": profile.average_request_rate,
                    "baseline_snapshot_v1": profile.baseline_snapshot_v1,
                },
                "alert": {
                    "id": new_alert.id,
                    "identity_id": new_alert.identity_id,
                    "severity": new_alert.severity,
                    "title": new_alert.title,
                    "description": new_alert.description,
                    "timestamp": new_alert.timestamp.isoformat()
                } if new_alert else None,
                "poisoning_state": {
                    "identity_id": updated_poisoning.identity_id,
                    "suspicion_score": updated_poisoning.suspicion_score,
                    "gradual_drifts_count": updated_poisoning.gradual_drifts_count,
                    "baseline_changes_attempted": updated_poisoning.baseline_changes_attempted,
                    "baseline_changes_approved": updated_poisoning.baseline_changes_approved,
                    "baseline_changes_blocked": updated_poisoning.baseline_changes_blocked,
                    "attack_stage": updated_poisoning.attack_stage
                },
                "prediction": {
                    "id": pred_id,
                    "prediction": ml_result["prediction"],
                    "confidence": ml_result["confidence"],
                    "probabilities": ml_result["probabilities"],
                    "features": ml_result["features"],
                    "reasons": ml_result["reasons"],
                    "disclaimer": ml_result.get("disclaimer", "Prototype / Synthetic Dataset - Not for production use"),
                }
            }

            if self.broadcast_callback:
                await self.broadcast_callback(ws_payload)

            return ws_payload

        finally:
            db.close()

    def _craft_event(self, scenario: str, identity: Identity, profile: BehaviorProfile, step: int) -> Dict[str, Any]:
        """Crafts scenario-specific event attributes based on active simulation mode."""
        normal_resources = list(profile.normal_resources or ["payment_db"])
        normal_actions = list(profile.normal_actions or ["READ", "WRITE"])
        avg_rate = profile.average_request_rate or 100.0

        if scenario == "normal":
            return {
                "action": random.choice(normal_actions),
                "resource": random.choice(normal_resources),
                "request_rate": round(avg_rate + random.uniform(-6.0, 6.0), 1),
                "source": "internal-service",
                "sensitivity": profile.sensitivity_profile or "medium"
            }

        elif scenario in ["drift", "legitimate_drift"]:
            # Legitimate Workload Evolution:
            # Introducing audit_metrics_db with steady moderate velocity
            if step <= 2:
                return {
                    "action": "READ",
                    "resource": "audit_metrics_db",
                    "request_rate": round(avg_rate * 1.25, 1),
                    "source": "internal-service",
                    "sensitivity": "medium"
                }
            else:
                return {
                    "action": "WRITE",
                    "resource": "audit_metrics_db",
                    "request_rate": round(avg_rate * 1.3, 1),
                    "source": "internal-service",
                    "sensitivity": "medium"
                }

        elif scenario == "attack":
            # Sudden Attack:
            # Massive rate spike, critical unapproved resource, destructive action, malicious ingress
            attack_actions = ["DELETE", "EXPORT", "EXFILTRATE", "ENCRYPT"]
            critical_resources = ["vault_master_keys", "customer_pii_db", "prod_root_certificates"]
            
            return {
                "action": random.choice(attack_actions),
                "resource": random.choice(critical_resources),
                "request_rate": round(avg_rate * random.uniform(3.8, 5.2), 1),
                "source": "tor-exit-node",
                "sensitivity": "critical"
            }

        elif scenario in ["poisoning", "baseline_poisoning"]:
            # Gradual Boiling Frog Behavioral Poisoning (7 Stages):
            # 1: NORMAL
            # 2: SMALL_DRIFT (novel low-impact resource)
            # 3: REPEATED_DRIFT (repeated queries)
            # 4: INCREASING_FREQUENCY (accelerating rate)
            # 5: SUSPICIOUS (untrusted source, sensitive resource)
            # 6: POISONING_DETECTED (critical resource target)
            # 7: BASELINE_PROTECTED (exfiltration blocked)
            sub_step = ((step - 1) % 7) + 1

            if sub_step == 1:
                return {
                    "action": "READ",
                    "resource": normal_resources[0],
                    "request_rate": round(avg_rate * 1.02, 1),
                    "source": "internal-service",
                    "sensitivity": "medium"
                }
            elif sub_step == 2:
                return {
                    "action": "READ",
                    "resource": "log_exporter_v2",
                    "request_rate": round(avg_rate * 1.22, 1),
                    "source": "internal-service",
                    "sensitivity": "low"
                }
            elif sub_step == 3:
                return {
                    "action": "QUERY",
                    "resource": "temp_staging_bucket",
                    "request_rate": round(avg_rate * 1.55, 1),
                    "source": "internal-service",
                    "sensitivity": "medium"
                }
            elif sub_step == 4:
                return {
                    "action": "QUERY",
                    "resource": "temp_staging_bucket",
                    "request_rate": round(avg_rate * 2.15, 1),
                    "source": "internal-service",
                    "sensitivity": "medium"
                }
            elif sub_step == 5:
                return {
                    "action": "EXPORT",
                    "resource": "billing_audit_cache",
                    "request_rate": round(avg_rate * 2.75, 1),
                    "source": "untrusted-vpc",
                    "sensitivity": "high"
                }
            elif sub_step == 6:
                return {
                    "action": "EXPORT",
                    "resource": "customer_pii_db",
                    "request_rate": round(avg_rate * 3.4, 1),
                    "source": "external-vpn",
                    "sensitivity": "critical"
                }
            else:
                return {
                    "action": "EXFILTRATE",
                    "resource": "vault_master_keys",
                    "request_rate": round(avg_rate * 4.3, 1),
                    "source": "tor-exit-node",
                    "sensitivity": "critical"
                }

        # Fallback default normal
        return {
            "action": normal_actions[0],
            "resource": normal_resources[0],
            "request_rate": round(avg_rate, 1),
            "source": "internal-service",
            "sensitivity": "medium"
        }

    def _craft_slow_burn_event(self, window: int, profile: BehaviorProfile, is_legitimate: bool = False) -> Dict[str, Any]:
        """Craft slow-burn events tailored for each observation window."""
        avg_rate = profile.average_request_rate or 100.0

        if is_legitimate:
            # Legitimate workload evolution: consistent internal source, moderate rate
            return {
                "action": "READ" if window <= 2 else "WRITE",
                "resource": "audit_metrics_db",
                "request_rate": round(avg_rate * 1.25, 1),
                "source": "internal-service",
                "sensitivity": "medium"
            }

        # Slow-burn compromise windows
        if window == 0:
            # Baseline - perfectly normal
            return {
                "action": "READ",
                "resource": "payment_db",
                "request_rate": round(avg_rate + random.uniform(-5, 5), 1),
                "source": "internal-service",
                "sensitivity": "medium"
            }
        elif window == 1:
            # Window 1: Small resource deviation - new resource (low impact)
            return {
                "action": "READ",
                "resource": "audit_metrics_db",
                "request_rate": round(avg_rate * 1.10, 1),
                "source": "internal-service",
                "sensitivity": "medium"
            }
        elif window == 2:
            # Window 2: Repeated access to novel resource
            return {
                "action": "READ",
                "resource": "audit_metrics_db",
                "request_rate": round(avg_rate * 1.15, 1),
                "source": "internal-service",
                "sensitivity": "medium"
            }
        elif window == 3:
            # Window 3: Frequency deviation (50-60% above baseline)
            return {
                "action": "READ",
                "resource": "audit_metrics_db",
                "request_rate": round(avg_rate * 1.55, 1),
                "source": "internal-service",
                "sensitivity": "medium"
            }
        elif window == 4:
            # Window 4: Sequence deviation - WRITE to audit_metrics_db after reads
            return {
                "action": "WRITE",
                "resource": "audit_metrics_db",
                "request_rate": round(avg_rate * 1.60, 1),
                "source": "internal-service",
                "sensitivity": "medium"
            }
        else:
            # Window 5: Sensitive resource access - customer PII (highest risk)
            return {
                "action": "READ",
                "resource": "customer_pii_db",
                "request_rate": round(avg_rate * 1.65, 1),
                "source": "internal-service",
                "sensitivity": "high"
            }

simulation_coordinator = SimulationCoordinator()
