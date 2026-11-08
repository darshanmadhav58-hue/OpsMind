import sqlite3
import json

def inspect():
    conn = sqlite3.connect('opsmind.db')
    cur = conn.cursor()
    
    inc_id = 'INC-20261105-0196'
    cur.execute('SELECT id, title, service, severity, status, recalled_from_incident_id, hindsight_similarity_score, suspected_root_cause, created_at FROM incidents WHERE id = ?', (inc_id,))
    inc = cur.fetchone()
    print("=== STAGE 2 INCIDENT RECORD ===")
    print(f"Incident ID: {inc[0]}")
    print(f"Title: {inc[1]}")
    print(f"Service: {inc[2]}")
    print(f"Severity: {inc[3]}")
    print(f"Status: {inc[4]}")
    print(f"Recalled From Incident ID: {inc[5]}")
    print(f"Hindsight Similarity Score: {inc[6]:.2%}")
    print(f"Suspected Root Cause: {inc[7]}")
    print(f"Timestamp: {inc[8]}")

    print("\n=== INVESTIGATION STEPS (TIMELINE) ===")
    cur.execute('SELECT step_type, title, description, evidence, confidence FROM investigation_steps WHERE incident_id = ? ORDER BY id ASC', (inc_id,))
    for step in cur.fetchall():
        print(f"\n[{step[0]}] {step[1]} (Confidence: {step[4]})")
        print(f"Description:\n{step[2]}")
        print(f"Evidence: {step[3]}")

    print("\n=== REMEDIATION ACTIONS ===")
    cur.execute('SELECT command, description, risk_level, status FROM remediation_actions WHERE incident_id = ?', (inc_id,))
    for act in cur.fetchall():
        print(f"- Command: {act[0]}")
        print(f"  Description: {act[1]}")
        print(f"  Risk: {act[2]} | Status: {act[3]}")

    conn.close()

    print("\n=== VERIFYING ACTUAL HINDSIGHT DISK RECORD ===")
    with open('backend/data/hindsight_memory_banks.json', 'r', encoding='utf-8') as f:
        banks = json.load(f)
    
    stage1_id = inc[5]
    incidents_bank = banks.get('opsmind-incidents', [])
    matched_memory = None
    for mem in incidents_bank:
        if mem.get('metadata', {}).get('incident_id') == stage1_id:
            matched_memory = mem
            break
    
    if matched_memory:
        print(f"Found Stage 1 Memory in Hindsight Bank 'opsmind-incidents'!")
        print(f"Memory ID: {matched_memory['memory_id']}")
        print(f"Tags: {matched_memory['tags']}")
        print(f"Metadata: {matched_memory['metadata']}")
        print(f"Content:\n{matched_memory['content']}")
    else:
        print(f"Memory for {stage1_id} not found in bank.")

if __name__ == '__main__':
    inspect()

