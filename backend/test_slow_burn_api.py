import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_slow_burn_full_lifecycle():
    client = TestClient(app)

    # 1. Reset slow-burn simulation
    r_reset = client.post("/api/simulation/slow-burn/reset")
    assert r_reset.status_code == 200
    res_data = r_reset.json()
    assert res_data["status"] == "slow_burn_reset"
    print("[PASS] Reset completed")

    # 2. Verify initial status
    r_status = client.get("/api/slow-burn/status")
    assert r_status.status_code == 200
    status_data = r_status.json()
    assert status_data["observation_window"] == 0
    assert status_data["trusted_baseline_status"] in ["PROTECTED", "INITIALIZING"]
    assert "canonical_progression" in status_data
    assert len(status_data["canonical_progression"]) == 5
    print("[PASS] Initial status verified (Window 0, 5 canonical deviation windows)")

    # 3. Step through Windows 0 to 5
    for window in range(6):
        r_step = client.post(f"/api/simulation/slow-burn/step/{window}")
        assert r_step.status_code == 200, f"Step {window} failed: {r_step.text}"
        payload = r_step.json()
        assert "slow_burn" in payload
        sb = payload["slow_burn"]
        assert sb["observation_window"] == window
        print(f"[PASS] Window {window}: Instant Risk={sb['instant_risk']}, Cumulative Risk={sb['cumulative_risk']}, State={sb['trust_state']}, Decision={sb['baseline_decision']}")

    # 4. Verify end-state at Window 5
    r_final = client.get("/api/slow-burn/status")
    assert r_final.status_code == 200
    final_data = r_final.json()
    assert final_data["observation_window"] == 5
    assert final_data["current_trust_state"] in ["SUSPICIOUS", "HIGH-RISK"]
    assert final_data["cumulative_risk_score"] >= 65.0
    assert final_data["baseline_decision"] in ["BLOCKED", "BLOCK_UPDATE"]
    assert final_data["trusted_baseline_status"] == "PROTECTED"
    print("[PASS] Window 5 Final State: Cumulative Risk >= 65, Baseline Protected, Update BLOCKED")

    # 5. Check History Endpoint
    r_hist = client.get("/api/slow-burn/history")
    assert r_hist.status_code == 200
    history = r_hist.json()
    assert len(history) >= 6
    print(f"[PASS] History retrieved with {len(history)} observations")

def test_slow_burn_evaluation_suite():
    client = TestClient(app)

    r_eval = client.post("/api/evaluation/slow-burn")
    assert r_eval.status_code == 200, f"Evaluation failed: {r_eval.text}"
    eval_data = r_eval.json()
    assert "summary" in eval_data
    assert "results" in eval_data

    summary = eval_data["summary"]
    pass_rate = summary["pass_rate"]
    total = summary["total_tests"]
    passed = summary["passed"]
    failed = summary["failed"]

    print(f"[PASS] Evaluation Suite Run: {passed}/{total} passed ({pass_rate}%)")
    for r in eval_data["results"]:
        status_mark = "PASS" if r["passed"] else "FAIL"
        print(f"  [{status_mark}] {r['scenario']} (State: {r['actual_state']}, Decision: {r['actual_baseline_decision']})")

    assert pass_rate >= 75.0, f"Pass rate {pass_rate}% below required 75%"

if __name__ == "__main__":
    test_slow_burn_full_lifecycle()
    test_slow_burn_evaluation_suite()
