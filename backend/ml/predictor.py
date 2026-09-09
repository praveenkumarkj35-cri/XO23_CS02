"""
TrustNexus AI — ML Risk Predictor
Wraps the trained Random Forest model for per-event predictions.
All predictions are labeled: "Prototype / Synthetic Dataset"
"""
import os
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("trustnexus.ml")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "nhi_risk_model.joblib")

FEATURE_NAMES = [
    "request_rate_normalized",
    "frequency_deviation",
    "resource_novelty_score",
    "action_novelty_score",
    "time_anomaly_score",
    "sequence_anomaly_score",
    "sensitivity_score",
    "context_risk_score",
    "repetition_score",
    "stability_score",
]

_bundle = None

def _load_bundle():
    global _bundle
    if _bundle is not None:
        return _bundle
    try:
        import joblib
        if os.path.exists(MODEL_PATH):
            _bundle = joblib.load(MODEL_PATH)
            logger.info(f"ML model loaded from {MODEL_PATH} (acc={_bundle.get('accuracy', 0)*100:.1f}%)")
        else:
            logger.warning(f"ML model not found at {MODEL_PATH}. Predictions will use statistical fallback.")
            _bundle = None
    except Exception as e:
        logger.error(f"Failed to load ML model: {e}")
        _bundle = None
    return _bundle


def extract_features(
    event_data: Dict[str, Any],
    profile_avg_rate: float,
    profile_normal_resources: List[str],
    profile_normal_actions: List[str],
    risk_score: float,
    factors: List[Dict[str, Any]],
    is_novel: bool,
) -> Dict[str, float]:
    """
    Extracts the 10-feature vector from an event for ML prediction.
    Compatible with the training dataset feature schema.
    """
    avg_rate = profile_avg_rate or 100.0
    req_rate = float(event_data.get("request_rate", avg_rate))
    resource = event_data.get("resource", "")
    action = event_data.get("action", "READ")
    source = event_data.get("source", "internal-service")
    sensitivity = event_data.get("sensitivity", "medium").lower()
    hour = event_data.get("timestamp_hour", 12)

    # request_rate_normalized: actual / baseline  (clipped to [0,6])
    rate_norm = min(6.0, req_rate / max(avg_rate, 1.0))

    # frequency_deviation: normalized deviation score [0,1]
    freq_deviation = min(1.0, abs(req_rate - avg_rate) / max(avg_rate, 1.0))

    # resource_novelty_score: 0 if known, scaled if new
    resource_novelty = 0.0
    if resource not in (profile_normal_resources or []):
        sensitivity_boost = {"low": 0.3, "medium": 0.5, "high": 0.8, "critical": 1.0}
        resource_novelty = sensitivity_boost.get(sensitivity, 0.5)

    # action_novelty_score: 0 if known, 0.6 for novel, 1.0 for destructive
    high_risk_actions = {"DELETE", "ENCRYPT", "EXPORT", "DROP_TABLE", "EXFILTRATE"}
    action_novelty = 0.0
    if action not in (profile_normal_actions or []):
        action_novelty = 1.0 if action in high_risk_actions else 0.6

    # time_anomaly_score: binary 0 or 1 (out of hours)
    time_anomaly = 1.0 if (hour < 8 or hour > 18) else 0.0

    # sequence_anomaly_score: approximated from factors
    seq_factor = next((f for f in factors if "Sequence" in f.get("factor", "")), None)
    sequence_anomaly = min(1.0, seq_factor["score"] / 15.0) if seq_factor else 0.0

    # sensitivity_score: mapped to [0,1]
    sens_map = {"low": 0.0, "medium": 0.3, "high": 0.7, "critical": 1.0}
    sensitivity_score = sens_map.get(sensitivity, 0.3)

    # context_risk_score
    src_map = {
        "internal-service": 0.0,
        "k8s-cluster": 0.0,
        "internal-vpc": 0.05,
        "external-vpn": 0.4,
        "unknown-external-ip": 0.7,
        "compromised-k8s-node": 0.85,
        "tor-exit-node": 1.0,
    }
    context_risk = src_map.get(source, 0.3)

    # repetition_score: high if behavior is well-known, low if novel
    repetition_score = 0.1 if is_novel else 0.9

    # stability_score: inverse of normalized risk score
    stability_score = max(0.0, 1.0 - (risk_score / 100.0))

    return {
        "request_rate_normalized": round(rate_norm, 4),
        "frequency_deviation": round(freq_deviation, 4),
        "resource_novelty_score": round(resource_novelty, 4),
        "action_novelty_score": round(action_novelty, 4),
        "time_anomaly_score": round(time_anomaly, 4),
        "sequence_anomaly_score": round(sequence_anomaly, 4),
        "sensitivity_score": round(sensitivity_score, 4),
        "context_risk_score": round(context_risk, 4),
        "repetition_score": round(repetition_score, 4),
        "stability_score": round(stability_score, 4),
    }


def predict(
    features: Dict[str, float],
    statistical_risk: float,
    statistical_state: str,
) -> Dict[str, Any]:
    """
    Runs ML prediction. Falls back to statistical engine if model unavailable.
    Returns dict with: prediction, confidence, probabilities, reasons, features, disclaimer
    """
    bundle = _load_bundle()

    if bundle is None:
        # Statistical fallback
        return {
            "prediction": statistical_state,
            "confidence": 0.75,
            "probabilities": {"NORMAL": 0.0, "DRIFTING": 0.0, "SUSPICIOUS": 0.0, "HIGH_RISK": 0.0},
            "reasons": ["ML model not available — using statistical engine result"],
            "features": features,
            "model_available": False,
            "disclaimer": "Prototype / Synthetic Dataset",
        }

    clf = bundle["model"]
    label_names = bundle["label_names"]
    label_decoding = bundle["label_decoding"]
    feat_importances = bundle.get("feature_importances", {})

    # Build feature vector in correct order
    feat_vector = [[features.get(f, 0.0) for f in FEATURE_NAMES]]

    proba = clf.predict_proba(feat_vector)[0]
    pred_idx = int(proba.argmax())
    confidence = float(proba[pred_idx])
    prediction = label_decoding[pred_idx]

    # Map class probabilities
    probabilities = {}
    for i, cls_name in enumerate(label_names):
        # class_index from label_encoding
        cls_idx = bundle["label_encoding"][cls_name]
        # Find position in classifier's classes_
        classes_list = list(clf.classes_)
        if cls_idx in classes_list:
            pos = classes_list.index(cls_idx)
            probabilities[cls_name] = round(float(proba[pos]), 4)
        else:
            probabilities[cls_name] = 0.0

    # Generate explainable reasons
    reasons = _generate_reasons(features, feat_importances, prediction)

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4),
        "probabilities": probabilities,
        "reasons": reasons,
        "features": features,
        "model_available": True,
        "disclaimer": "Prototype / Synthetic Dataset — Not for production use",
        "feature_importances": {k: round(v, 4) for k, v in feat_importances.items()},
    }


def _generate_reasons(features: Dict[str, float], importances: Dict[str, float], prediction: str) -> List[str]:
    """Generates human-readable explanation reasons based on top contributing features."""
    reasons = []
    threshold_map = {
        "request_rate_normalized": (2.0, "Request frequency {:.1f}x above baseline"),
        "frequency_deviation": (0.5, "Frequency deviation {:.0%} above normal range"),
        "resource_novelty_score": (0.3, "Novel resource access detected (novelty score: {:.2f})"),
        "action_novelty_score": (0.4, "Unestablished or high-risk action executed (score: {:.2f})"),
        "time_anomaly_score": (0.5, "Activity outside normal operating hours"),
        "sequence_anomaly_score": (0.3, "Abnormal action sequence pattern (score: {:.2f})"),
        "sensitivity_score": (0.6, "Access to high-sensitivity resource (score: {:.2f})"),
        "context_risk_score": (0.3, "Risky network context / untrusted ingress (score: {:.2f})"),
        "repetition_score": (None, None),   # low score means novel
        "stability_score": (None, None),    # low score means unstable
    }

    if features.get("repetition_score", 1.0) < 0.3:
        reasons.append("Behavior never or rarely observed before (low repetition)")
    if features.get("stability_score", 1.0) < 0.3:
        reasons.append("Highly unstable behavioral pattern (low stability)")

    for feat, (threshold, template) in threshold_map.items():
        if threshold is None:
            continue
        val = features.get(feat, 0.0)
        if val >= threshold:
            try:
                reasons.append(template.format(val))
            except Exception:
                reasons.append(template)

    if not reasons:
        if prediction == "NORMAL":
            reasons.append("All behavioral features within normal baseline bounds")
        else:
            reasons.append(f"Multiple subtle behavioral indicators point to {prediction} classification")

    # Limit to top 5 reasons
    return reasons[:5]


def get_model_info() -> Dict[str, Any]:
    """Returns model metadata, accuracy, and feature importances."""
    bundle = _load_bundle()
    if bundle is None:
        return {
            "model_available": False,
            "accuracy": 0.0,
            "feature_importances": {},
            "disclaimer": "Prototype / Synthetic Dataset - Model not loaded",
        }
    return {
        "model_available": True,
        "accuracy": round(bundle.get("accuracy", 1.0), 4),
        "feature_importances": bundle.get("feature_importances", {}),
        "features": FEATURE_NAMES,
        "labels": bundle.get("label_names", ["NORMAL", "DRIFTING", "SUSPICIOUS", "HIGH_RISK"]),
        "disclaimer": bundle.get("disclaimer", "Prototype / Synthetic Dataset - Not for production use"),
    }


# Pre-load model at import time (non-blocking)
try:
    _load_bundle()
except Exception:
    pass

