"""
TrustNexus AI — NHI Risk Classification Training Script
Generates a synthetic dataset and trains an explainable Random Forest classifier.
Labeled: "Prototype / Synthetic Dataset"

Usage:
    python -m ml.train_model
    (from backend/ directory)
"""
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

RANDOM_SEED = 42
NUM_SAMPLES = 5000
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "nhi_risk_model.joblib")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DATASET_PATH = os.path.join(DATA_DIR, "nhi_behavior_dataset.csv")

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

LABEL_NAMES = ["NORMAL", "DRIFTING", "SUSPICIOUS", "HIGH_RISK"]
LABEL_ENCODING = {name: i for i, name in enumerate(LABEL_NAMES)}
LABEL_DECODING = {i: name for i, name in enumerate(LABEL_NAMES)}


def generate_dataset(n: int = NUM_SAMPLES, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate synthetic NHI behavioral dataset with reproducible seed."""
    rng = np.random.RandomState(seed)
    rows = []

    # Class distribution: 40% NORMAL, 25% DRIFTING, 20% SUSPICIOUS, 15% HIGH_RISK
    class_counts = {
        "NORMAL": int(n * 0.40),
        "DRIFTING": int(n * 0.25),
        "SUSPICIOUS": int(n * 0.20),
        "HIGH_RISK": int(n * 0.15),
    }

    for label, count in class_counts.items():
        for _ in range(count):
            if label == "NORMAL":
                row = {
                    "request_rate_normalized": rng.uniform(0.8, 1.2),
                    "frequency_deviation": rng.uniform(0.0, 0.3),
                    "resource_novelty_score": rng.uniform(0.0, 0.1),
                    "action_novelty_score": rng.uniform(0.0, 0.1),
                    "time_anomaly_score": rng.uniform(0.0, 0.1),
                    "sequence_anomaly_score": rng.uniform(0.0, 0.1),
                    "sensitivity_score": rng.uniform(0.0, 0.2),
                    "context_risk_score": rng.uniform(0.0, 0.05),
                    "repetition_score": rng.uniform(0.8, 1.0),
                    "stability_score": rng.uniform(0.85, 1.0),
                    "label": label,
                }
            elif label == "DRIFTING":
                row = {
                    "request_rate_normalized": rng.uniform(1.0, 1.8),
                    "frequency_deviation": rng.uniform(0.2, 0.6),
                    "resource_novelty_score": rng.uniform(0.2, 0.6),
                    "action_novelty_score": rng.uniform(0.0, 0.4),
                    "time_anomaly_score": rng.uniform(0.0, 0.3),
                    "sequence_anomaly_score": rng.uniform(0.0, 0.3),
                    "sensitivity_score": rng.uniform(0.1, 0.5),
                    "context_risk_score": rng.uniform(0.0, 0.2),
                    "repetition_score": rng.uniform(0.4, 0.8),
                    "stability_score": rng.uniform(0.5, 0.85),
                    "label": label,
                }
            elif label == "SUSPICIOUS":
                row = {
                    "request_rate_normalized": rng.uniform(1.5, 3.0),
                    "frequency_deviation": rng.uniform(0.5, 0.85),
                    "resource_novelty_score": rng.uniform(0.4, 0.8),
                    "action_novelty_score": rng.uniform(0.3, 0.7),
                    "time_anomaly_score": rng.uniform(0.2, 0.7),
                    "sequence_anomaly_score": rng.uniform(0.3, 0.7),
                    "sensitivity_score": rng.uniform(0.4, 0.8),
                    "context_risk_score": rng.uniform(0.1, 0.5),
                    "repetition_score": rng.uniform(0.1, 0.5),
                    "stability_score": rng.uniform(0.2, 0.55),
                    "label": label,
                }
            else:  # HIGH_RISK
                row = {
                    "request_rate_normalized": rng.uniform(2.5, 6.0),
                    "frequency_deviation": rng.uniform(0.75, 1.0),
                    "resource_novelty_score": rng.uniform(0.7, 1.0),
                    "action_novelty_score": rng.uniform(0.7, 1.0),
                    "time_anomaly_score": rng.uniform(0.5, 1.0),
                    "sequence_anomaly_score": rng.uniform(0.6, 1.0),
                    "sensitivity_score": rng.uniform(0.7, 1.0),
                    "context_risk_score": rng.uniform(0.5, 1.0),
                    "repetition_score": rng.uniform(0.0, 0.3),
                    "stability_score": rng.uniform(0.0, 0.3),
                    "label": label,
                }
            rows.append(row)

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    return df


def train():
    # Ensure output directories exist
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)

    print("=" * 60)
    print("TrustNexus AI - ML Training Script")
    print("Prototype / Synthetic Dataset")
    print("=" * 60)

    # Generate dataset
    print(f"\n[1/4] Generating synthetic dataset ({NUM_SAMPLES} samples)...")
    df = generate_dataset()
    df.to_csv(DATASET_PATH, index=False)
    print(f"      Dataset saved -> {DATASET_PATH}")
    print(f"      Class distribution:\n{df['label'].value_counts()}")

    # Prepare features and labels
    X = df[FEATURE_NAMES].values
    y = df["label"].map(LABEL_ENCODING).values

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    print(f"\n[2/4] Training Random Forest classifier...")
    print(f"      Train: {len(X_train)} samples | Test: {len(X_test)} samples")

    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # Evaluate
    print("\n[3/4] Evaluating model...")
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"      Accuracy: {acc*100:.2f}%")
    print("\n      Classification Report:")
    target_names = [LABEL_NAMES[i] for i in sorted(set(y_test))]
    print(classification_report(y_test, y_pred, target_names=target_names))

    # Feature importances
    importances = clf.feature_importances_
    feat_imp = sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    print("      Feature Importances:")
    for fname, imp in feat_imp:
        print(f"        {fname:<35} {imp:.4f}")

    # Save model bundle
    print(f"\n[4/4] Saving model -> {MODEL_PATH}")
    bundle = {
        "model": clf,
        "feature_names": FEATURE_NAMES,
        "label_names": LABEL_NAMES,
        "label_encoding": LABEL_ENCODING,
        "label_decoding": LABEL_DECODING,
        "accuracy": acc,
        "feature_importances": dict(zip(FEATURE_NAMES, importances.tolist())),
        "disclaimer": "Prototype / Synthetic Dataset - Not for production use",
    }
    joblib.dump(bundle, MODEL_PATH)
    print("\n[OK] Training complete!")
    print(f"   Model: {MODEL_PATH}")
    print(f"   Dataset: {DATASET_PATH}")
    return bundle


if __name__ == "__main__":
    train()
