import urllib.request
import json

def test():
    endpoints = [
        'http://localhost:8000/api/health',
        'http://localhost:8000/api/identities',
        'http://localhost:8000/api/events',
        'http://localhost:8000/api/alerts',
        'http://localhost:8000/api/baseline-changes',
        'http://localhost:8000/api/poisoning-defense',
        'http://localhost:8000/api/evaluation'
    ]

    for url in endpoints:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"GET {url} -> HTTP {resp.status} (Count/Keys: {len(data)})")

    for mode in ['normal', 'drift', 'attack', 'poisoning']:
        post_req = urllib.request.Request(f'http://localhost:8000/api/simulation/{mode}', method='POST')
        with urllib.request.urlopen(post_req) as resp:
            res = json.loads(resp.read().decode())
            status_type = res.get('type') or res.get('status')
            risk = res.get('event', {}).get('risk_score', 'N/A')
            state = res.get('event', {}).get('trust_state', 'N/A')
            print(f"POST /simulation/{mode} -> {status_type} | Risk: {risk} | State: {state}")

if __name__ == '__main__':
    test()
