import asyncio
from fastapi.testclient import TestClient
from app.main import app

def test_judge_demo():
    client = TestClient(app)
    
    # 1. Reset
    r_reset = client.post("/api/judge-demo/reset")
    assert r_reset.status_code == 200, f"Reset failed: {r_reset.text}"
    print("[PASS] Reset completed")

    # 2. Check initial status
    r_status = client.get("/api/judge-demo/status")
    assert r_status.status_code == 200
    stat = r_status.json()
    assert stat["is_complete"] == False
    assert stat["is_running"] == False
    print("[PASS] Initial status verified: is_complete=False")

    # 3. Test each step from 1 to 8
    expected_trust_states = {
        1: "NORMAL",
        2: "DRIFTING",
        3: "DRIFTING",
        4: "DRIFTING",
        5: "HIGH-RISK",
        6: "DRIFTING",
        7: "SUSPICIOUS",
        8: "HIGH-RISK"
    }

    expected_gate_decisions = {
        1: None,
        2: "PENDING",
        3: "PENDING",
        4: "APPROVED",
        5: "BLOCKED",
        6: "PENDING",
        7: "BLOCKED",
        8: "BLOCKED"
    }

    expected_baseline_versions = {
        1: 1,
        2: 1,
        3: 1,
        4: 2,
        5: 2,
        6: 2,
        7: 2,
        8: 2
    }

    for step in range(1, 9):
        resp = client.post(f"/api/judge-demo/step/{step}")
        assert resp.status_code == 200, f"Step {step} failed: {resp.text}"
        data = resp.json()
        assert data["step"] == step
        assert data["is_complete"] == (step == 8)
        
        evt = data["payload"]["event"]
        bc = data["payload"].get("baseline_change")
        ps = data["payload"].get("poisoning_state")
        bs = data["payload"].get("baseline_snapshot")
        
        gate_dec = bc.get("decision") if bc else None
        version = bs.get("version")
        trust_state = evt["trust_state"]
        
        print(f"Step {step}: TrustState={trust_state} Gate={gate_dec} Version={version} PoisonStage={ps.get('attack_stage')} SuspScore={ps.get('suspicion_score')}")

        assert trust_state == expected_trust_states[step], f"Step {step} state mismatch: got {trust_state}, expected {expected_trust_states[step]}"
        assert gate_dec == expected_gate_decisions[step], f"Step {step} gate mismatch: got {gate_dec}, expected {expected_gate_decisions[step]}"
        assert version == expected_baseline_versions[step], f"Step {step} version mismatch: got {version}, expected {expected_baseline_versions[step]}"

    # 4. Check Final Status & Verdicts
    final_status_resp = client.get("/api/judge-demo/status")
    assert final_status_resp.status_code == 200
    final_stat = final_status_resp.json()
    
    assert final_stat["is_complete"] == True
    print(f"[PASS] Final status is_complete: {final_stat['is_complete']}")
    
    verdicts = final_stat["verdicts"]
    print("Verdicts:", verdicts)
    assert verdicts["legitimate_evolution"] == "APPROVED", f"legitimate_evolution: {verdicts['legitimate_evolution']}"
    assert verdicts["sudden_attack"] == "BLOCKED", f"sudden_attack: {verdicts['sudden_attack']}"
    assert verdicts["baseline_poisoning"] == "BLOCKED", f"baseline_poisoning: {verdicts['baseline_poisoning']}"
    assert verdicts["trusted_baseline"] == "PROTECTED", f"trusted_baseline: {verdicts['trusted_baseline']}"

    print("[PASS] All 4 Invariant Verdicts verified successfully!")

    # 5. Verify Start, Stop, and Reset endpoints
    r_start = client.post("/api/judge-demo/start")
    assert r_start.status_code == 200
    start_data = r_start.json()
    assert start_data["status"] == "judge_demo_started"
    print("[PASS] POST /api/judge-demo/start verified")

    r_stop = client.post("/api/judge-demo/stop")
    assert r_stop.status_code == 200
    stop_data = r_stop.json()
    assert stop_data["status"] == "judge_demo_stopped"
    print("[PASS] POST /api/judge-demo/stop verified")

    r_reset2 = client.post("/api/judge-demo/reset")
    assert r_reset2.status_code == 200
    assert r_reset2.json()["status"] == "judge_demo_reset"
    print("[PASS] POST /api/judge-demo/reset verified")

if __name__ == "__main__":
    test_judge_demo()
