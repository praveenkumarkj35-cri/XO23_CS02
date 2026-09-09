# TRUSTNEXUS AI
## Adaptive Behavioral Trust for Non-Human Identities
### "Trust Behavior. Not Just Identity."

---

## Problem Statement

In modern cloud infrastructure, **Non-Human Identities (NHIs)** — service accounts, API keys, bots, CI/CD runners, microservices, and cloud workloads — vastly outnumber human users (often 45:1). These identities can be **compromised, hijacked, or manipulated** even when their credentials appear valid.

**Valid credentials ≠ Trusted behavior.**

Traditional identity security trusts a workload simply because its token is valid. TrustNexus AI takes a fundamentally different approach: it continuously monitors **behavioral patterns** and only trusts what it can **behaviorally verify**.

---

## Solution

TrustNexus AI implements **Adaptive Behavioral Trust** — a statistical real-time monitoring engine that:

1. Builds an **individual behavioral baseline** per NHI (not one global model)
2. **Continuously analyzes** every event against that baseline using explainable statistics
3. Calculates a **transparent 0-100 Risk Score** with human-readable explanations
4. Routes decisions through an **Adaptive Trust Gate** before updating baselines
5. Detects multi-stage **Baseline Poisoning** attacks in real-time

---

## Trust States

| State | Risk Score | Description |
|---|---|---|
| NORMAL | 0-29 | Behavior matches established baseline |
| DRIFTING | 30-54 | Changed, but may be legitimate evolution |
| SUSPICIOUS | 55-74 | Multiple anomaly indicators detected |
| HIGH-RISK | 75-100 | Strong evidence of compromise or attack |

---

## Tech Stack

**Backend:** FastAPI, SQLAlchemy, SQLite, WebSocket, Uvicorn, Python 3.11+

**Frontend:** React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons

---

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## API Endpoints

- GET /api/health
- GET /api/identities
- GET /api/events
- GET /api/alerts
- GET /api/baseline-changes
- GET /api/poisoning-defense
- GET /api/evaluation
- POST /api/simulation/normal
- POST /api/simulation/drift
- POST /api/simulation/attack
- POST /api/simulation/poisoning
- POST /api/simulation/start
- POST /api/simulation/stop
- POST /api/simulation/reset
- WS /ws/events

---

## Disclaimer

All data is 100% synthetic. No real credentials or production infrastructure is used.
All evaluation metrics are labeled as "Prototype / Simulated Evaluation".
