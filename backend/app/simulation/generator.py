import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List
from ..models.entities import Identity, BehaviorProfile, Event, Alert, PoisoningState, BaselineChange

SEED_IDENTITIES = [
    {
        "id": "payment-service",
        "name": "Payment Processing Engine",
        "type": "microservice",
        "owner": "fintech-core",
        "environment": "production",
        "current_state": "NORMAL",
        "trust_score": 96.5,
        "risk_score": 6.2,
        "baseline_confidence": 98.4,
        "profile": {
            "normal_resources": ["payment_db", "payment_gateway_api", "transaction_ledger"],
            "normal_actions": ["READ", "WRITE", "VERIFY"],
            "average_request_rate": 100.0,
            "std_request_rate": 12.5,
            "normal_hours_start": 8,
            "normal_hours_end": 18,
            "common_sequences": [["READ", "VERIFY"], ["VERIFY", "WRITE"]],
            "sensitivity_profile": "high",
            "confidence": 98.4,
            "version": 1
        }
    },
    {
        "id": "analytics-service",
        "name": "BI Analytics Pipeline",
        "type": "cloud_workload",
        "owner": "data-platform",
        "environment": "production",
        "current_state": "NORMAL",
        "trust_score": 94.0,
        "risk_score": 8.5,
        "baseline_confidence": 97.1,
        "profile": {
            "normal_resources": ["analytics_warehouse", "metrics_collector", "aggregate_cache"],
            "normal_actions": ["READ", "QUERY", "EXPORT"],
            "average_request_rate": 50.0,
            "std_request_rate": 8.0,
            "normal_hours_start": 10,
            "normal_hours_end": 20,
            "common_sequences": [["QUERY", "READ"], ["READ", "EXPORT"]],
            "sensitivity_profile": "medium",
            "confidence": 97.1,
            "version": 1
        }
    },
    {
        "id": "notification-bot",
        "name": "Customer Alerts Dispatcher",
        "type": "bot",
        "owner": "growth-eng",
        "environment": "production",
        "current_state": "NORMAL",
        "trust_score": 98.0,
        "risk_score": 4.0,
        "baseline_confidence": 99.0,
        "profile": {
            "normal_resources": ["sqs_message_queue", "email_sender_api", "push_gateway"],
            "normal_actions": ["READ", "PUSH", "SEND"],
            "average_request_rate": 25.0,
            "std_request_rate": 5.0,
            "normal_hours_start": 0,
            "normal_hours_end": 23,
            "common_sequences": [["READ", "PUSH"], ["PUSH", "SEND"]],
            "sensitivity_profile": "low",
            "confidence": 99.0,
            "version": 1
        }
    },
    {
        "id": "ci-cd-runner",
        "name": "GitHub Actions Auto-Deployer",
        "type": "ci_cd_runner",
        "owner": "devops-sec",
        "environment": "production",
        "current_state": "NORMAL",
        "trust_score": 95.2,
        "risk_score": 7.1,
        "baseline_confidence": 96.5,
        "profile": {
            "normal_resources": ["git_repo_cache", "docker_registry", "build_artifacts_s3"],
            "normal_actions": ["READ", "BUILD", "DEPLOY"],
            "average_request_rate": 40.0,
            "std_request_rate": 10.0,
            "normal_hours_start": 6,
            "normal_hours_end": 22,
            "common_sequences": [["READ", "BUILD"], ["BUILD", "DEPLOY"]],
            "sensitivity_profile": "medium",
            "confidence": 96.5,
            "version": 1
        }
    },
    {
        "id": "inventory-service",
        "name": "Global Inventory Synchronizer",
        "type": "microservice",
        "owner": "supply-chain",
        "environment": "production",
        "current_state": "NORMAL",
        "trust_score": 97.1,
        "risk_score": 5.3,
        "baseline_confidence": 98.0,
        "profile": {
            "normal_resources": ["inventory_catalog_db", "order_queue", "sku_price_index"],
            "normal_actions": ["READ", "UPDATE", "BATCH_SYNC"],
            "average_request_rate": 80.0,
            "std_request_rate": 14.0,
            "normal_hours_start": 7,
            "normal_hours_end": 21,
            "common_sequences": [["READ", "UPDATE"], ["UPDATE", "BATCH_SYNC"]],
            "sensitivity_profile": "medium",
            "confidence": 98.0,
            "version": 1
        }
    },
    {
        "id": "backup-worker",
        "name": "Nightly Database Archiver",
        "type": "service_account",
        "owner": "infra-ops",
        "environment": "production",
        "current_state": "NORMAL",
        "trust_score": 99.2,
        "risk_score": 2.1,
        "baseline_confidence": 99.5,
        "profile": {
            "normal_resources": ["snapshot_storage_bucket", "backup_catalog", "cold_storage_glacier"],
            "normal_actions": ["BACKUP", "ARCHIVE", "VERIFY_INTEGRITY"],
            "average_request_rate": 15.0,
            "std_request_rate": 3.0,
            "normal_hours_start": 1,
            "normal_hours_end": 5,
            "common_sequences": [["BACKUP", "ARCHIVE"], ["ARCHIVE", "VERIFY_INTEGRITY"]],
            "sensitivity_profile": "high",
            "confidence": 99.5,
            "version": 1
        }
    }
]

def seed_database_if_needed(db):
    """Populates seed identities, profiles, poisoning states, and initial events if empty."""
    existing_count = db.query(Identity).count()
    if existing_count > 0:
        return

    now = datetime.utcnow()

    for item in SEED_IDENTITIES:
        identity = Identity(
            id=item["id"],
            name=item["name"],
            type=item["type"],
            owner=item["owner"],
            environment=item["environment"],
            current_state=item["current_state"],
            trust_score=item["trust_score"],
            risk_score=item["risk_score"],
            baseline_confidence=item["baseline_confidence"],
            created_at=now - timedelta(days=30),
            last_seen=now
        )
        db.add(identity)
        db.flush()

        p_data = item["profile"]
        profile = BehaviorProfile(
            identity_id=identity.id,
            normal_resources=p_data["normal_resources"],
            normal_actions=p_data["normal_actions"],
            average_request_rate=p_data["average_request_rate"],
            std_request_rate=p_data["std_request_rate"],
            normal_hours_start=p_data["normal_hours_start"],
            normal_hours_end=p_data["normal_hours_end"],
            common_sequences=p_data["common_sequences"],
            sensitivity_profile=p_data["sensitivity_profile"],
            confidence=p_data["confidence"],
            version=p_data["version"],
            updated_at=now - timedelta(days=1)
        )
        db.add(profile)

        poisoning = PoisoningState(
            identity_id=identity.id,
            suspicion_score=0.0,
            gradual_drifts_count=0,
            baseline_changes_attempted=0,
            baseline_changes_approved=0,
            baseline_changes_blocked=0,
            attack_stage="NORMAL",
            last_evaluated=now
        )
        db.add(poisoning)

        # Add 3 initial normal historical events
        for i in range(3):
            action = random.choice(p_data["normal_actions"])
            resource = random.choice(p_data["normal_resources"])
            rate = p_data["average_request_rate"] + random.uniform(-5, 5)
            evt = Event(
                id=str(uuid.uuid4()),
                identity_id=identity.id,
                action=action,
                resource=resource,
                timestamp=now - timedelta(minutes=(3 - i) * 5),
                request_rate=round(rate, 1),
                source="internal-service",
                sensitivity=p_data["sensitivity_profile"],
                risk_score=round(random.uniform(4.0, 12.0), 1),
                trust_state="NORMAL",
                explanation="Behavior matches established historical baseline profile.",
                factors=[{"factor": "Baseline Match", "score": 5.0, "reason": "Consistent resource and action usage"}]
            )
            db.add(evt)

    # Add initial seed alert
    alert = Alert(
        id=str(uuid.uuid4()),
        identity_id="payment-service",
        severity="LOW",
        title="Scheduled Baseline Integrity Verification Passed",
        description="Daily behavioral model validation completed with 98.4% confidence score across all metrics.",
        timestamp=now - timedelta(hours=2),
        status="RESOLVED"
    )
    db.add(alert)
    db.commit()
