import subprocess
import time
import sys
import httpx

def main():
    print("Starting uvicorn server on port 8089...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8089"],
        cwd="backend"
    )
    time.sleep(2.5)
    try:
        with httpx.Client(base_url="http://127.0.0.1:8089", timeout=5.0) as client:
            # 1. Health check
            r_health = client.get("/api/v1/health")
            print(f"Health Status: {r_health.status_code}")
            assert r_health.status_code == 200, f"Health check failed: {r_health.text}"
            health_data = r_health.json()
            print(f"  App: {health_data['app_name']}")
            print(f"  DB: {health_data['database']}")
            print(f"  Hindsight Persisted Memories: {health_data['hindsight']['persisted_memories']}")

            # 2. Memory banks
            r_banks = client.get("/api/v1/memory/banks")
            print(f"Memory Banks Status: {r_banks.status_code}")
            assert r_banks.status_code == 200, f"Memory banks failed: {r_banks.text}"
            banks_data = r_banks.json()
            print(f"  Banks: {list(banks_data['banks'].keys())}")

            # 3. Memory records for opsmind-services
            r_records = client.get("/api/v1/memory/records?bank=opsmind-services")
            print(f"Memory Records Status: {r_records.status_code}")
            assert r_records.status_code == 200
            print(f"  Services Records Count: {r_records.json()['total_records']}")

            # 4. Ingest an incident (Cold Start)
            r_inc = client.post("/api/v1/incidents/ingest", json={
                "source": "Kubernetes-Probe",
                "service": "billing-service",
                "alert_name": "ConnectionLeak",
                "severity": "P1",
                "message": "Billing worker thread pool exhausted connecting to database.",
                "raw_logs": "FATAL: Connection pool has 0 available connections."
            })
            print(f"Ingest Incident Status: {r_inc.status_code}")
            assert r_inc.status_code == 200
            inc_data = r_inc.json()
            inc_id = inc_data["id"]
            print(f"  Created Incident: {inc_id} (Status: {inc_data['status']})")
            print(f"  Investigation Steps Count: {len(inc_data['investigation_steps'])}")

            # 5. Resolve incident -> Should retain into Hindsight
            r_res = client.post(f"/api/v1/incidents/{inc_id}/resolve", json={
                "confirmed_root_cause": "Database connection pool exhausted due to unclosed cursor in billing batch job",
                "resolution_summary": "Deployed hotfix with context manager auto-closing cursors and bumped pool max to 100",
                "lessons_learned": "Always enforce context managers for database transactions"
            })
            print(f"Resolve Incident Status: {r_res.status_code}")
            assert r_res.status_code == 200
            res_data = r_res.json()
            print(f"  Resolved: {res_data['id']}, Retained Memory ID: {res_data['hindsight_memory_id']}")
            assert res_data["hindsight_memory_id"] is not None

            # 6. Verify Incidents Bank now has the retained memory
            r_records_inc = client.get("/api/v1/memory/records?bank=opsmind-incidents")
            assert r_records_inc.status_code == 200
            print(f"  Incidents Bank Records Count: {r_records_inc.json()['total_records']}")
            assert r_records_inc.json()['total_records'] >= 1

            # 7. Ingest recurrent incident -> Should recall prior incident
            r_recurrent = client.post("/api/v1/incidents/ingest", json={
                "source": "Datadog-Probe",
                "service": "billing-service",
                "alert_name": "DBConnectionTimeout",
                "severity": "P1",
                "message": "Billing workers experiencing connection leak on database.",
                "raw_logs": "ERROR: Billing connection timeout on pool."
            })
            assert r_recurrent.status_code == 200
            rec_data = r_recurrent.json()
            print(f"  Recurrent Incident: {rec_data['id']}")
            print(f"  Recalled From: {rec_data['recalled_from_incident_id']}")
            print(f"  Hindsight Similarity: {rec_data.get('hindsight_similarity_score')}")
            assert rec_data["recalled_from_incident_id"] == inc_id
            assert rec_data.get("hindsight_similarity_score", 0) >= 0.50

            print("\n>>> ALL LIVE HTTP CHECKS PASSED PERFECTLY! <<<")
    finally:
        proc.terminate()
        proc.wait(timeout=3)

if __name__ == "__main__":
    main()

