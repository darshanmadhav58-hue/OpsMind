import httpx
import json
import sqlite3

def test_4_scenarios():
    print("=" * 60)
    print("VERIFYING ALL 4 EXISTING OPSMIND INCIDENTS VIA LIVE API")
    print("=" * 60)
    
    with httpx.Client(base_url="http://127.0.0.1:8000/api/v1", timeout=5.0) as client:
        # 1. Fetch all incidents summary
        r_all = client.get("/incidents")
        assert r_all.status_code == 200, f"Failed to list incidents: {r_all.status_code}"
        incidents = r_all.json()
        print(f"Total Incidents Returned: {len(incidents)}\n")
        
        results = []

        for idx, summary in enumerate(incidents, 1):
            inc_id = summary["id"]
            print(f"--- Testing Scenario {idx}: {inc_id} ({summary['service']}) ---")
            
            # Fetch full incident detail
            r_detail = client.get(f"/incidents/{inc_id}")
            if r_detail.status_code != 200:
                print(f"  [FAIL] Could not fetch incident detail: {r_detail.status_code}")
                results.append((inc_id, summary["title"], False, f"GET returned {r_detail.status_code}"))
                continue
            
            data = r_detail.json()
            title = data.get("title", "")
            service = data.get("service", "")
            severity = data.get("severity", "")
            status = data.get("status", "")
            steps = data.get("investigation_steps", [])
            actions = data.get("remediation_actions", [])
            recalled_from = data.get("recalled_from_incident_id")
            sim_score = data.get("hindsight_similarity_score")
            mem_id = data.get("hindsight_memory_id")
            suspected_cause = data.get("suspected_root_cause")
            confirmed_cause = data.get("confirmed_root_cause")
            
            print(f"  Title: {title}")
            print(f"  Service: {service} | Severity: {severity} | Status: {status}")
            print(f"  Investigation Steps Count: {len(steps)}")
            for s in steps:
                print(f"    - [{s.get('step_type')}] {s.get('title')} (Confidence: {s.get('confidence')})")
            print(f"  Remediation Actions Count: {len(actions)}")
            for a in actions:
                print(f"    - Command: {a.get('command')} | Risk: {a.get('risk_level')} | Status: {a.get('status')}")
            
            # Verify specific scenario expectations
            passed = True
            reasons = []

            # Basic integrity check
            if not service or not severity or not status:
                passed = False
                reasons.append("Missing core fields")

            if len(steps) == 0:
                passed = False
                reasons.append("No investigation steps recorded")

            # Check scenario types
            if status == "RESOLVED":
                if not confirmed_cause:
                    # Note if resolved manually or via script
                    print("  Note: Resolved incident without confirmed root cause in DB field")
                print(f"  Resolution Summary: {data.get('resolution_summary')}")
                print(f"  Hindsight Memory ID: {mem_id}")
            elif status == "MITIGATING":
                # Recalled incident check
                if recalled_from:
                    print(f"  Recalled From: {recalled_from}")
                    print(f"  Similarity Score: {sim_score:.1%}" if sim_score else "  Similarity Score: N/A")
                    recall_steps = [s for s in steps if s.get("step_type") == "RECALL"]
                    if not recall_steps:
                        passed = False
                        reasons.append("Missing RECALL step in timeline for recurrent incident")
                else:
                    print("  Status is MITIGATING without prior recall")
            elif status in ("TRIGGERED", "INVESTIGATING"):
                print("  Active open incident under investigation")

            status_str = "PASS" if passed else "FAIL"
            print(f"  => Scenario Result: [{status_str}]" + (f" ({', '.join(reasons)})" if reasons else ""))
            print()
            results.append((inc_id, title, passed, reasons))

        print("=" * 60)
        print("SUMMARY TABLE:")
        print("=" * 60)
        for inc_id, title, passed, reasons in results:
            verdict = "PASSED" if passed else "FAILED"
            details = f" - Issues: {', '.join(reasons)}" if reasons else " - All checks verified"
            print(f"[{verdict}] {inc_id} | {title}{details}")

if __name__ == "__main__":
    test_4_scenarios()

