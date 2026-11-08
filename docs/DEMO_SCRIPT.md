# OpsMind: 2–5 Minute Video Demonstration Script

> **Video Duration:** 3 minutes 30 seconds  
> **Target Audience:** Judges, SRE Directors, DevOps Engineers  
> **Key Message:** OpsMind turns reactive incident triage into continuous institutional learning using Vectorize Hindsight persistent memory.

---

### [0:00 – 0:40] Scene 1: The Problem — Operational Amnesia
**Visual:**
- Camera opens on an engineer staring at terminal alerts at night.
- Screen transition to the OpsMind Incident Commander Dashboard with dark-mode SRE mission control UI.

**Narration (Voiceover):**
> *"Every software team knows the pain of the 3 AM on-call alert. But the real tragedy isn't the outage itself — it's when an engineer wastes three hours debugging a production failure that another teammate already resolved two months ago.*
> 
> *Stateless chatbots and generic vector RAG suffer from session amnesia: they have no temporal context, cannot traverse service topology, and forget everything the moment a session closes.*
> 
> *Meet **OpsMind**: an intelligent AI Incident Response Agent with true persistent memory, powered by **Vectorize Hindsight**."*

---

### [0:40 – 1:15] Scene 2: SRE Mission-Control Dashboard Tour
**Visual:**
- Screen captures the top navigation bar, highlighting the **Hindsight Memory: Active (3 Banks)** badge.
- Cursor hovers over the 6 real-time metric cards: Total Incidents, Active Incidents (P1 badge glowing), Resolved, Average MTTR, Hindsight Recalls, and Memory Efficacy.
- Brief pan over the left-hand Incident Feed with filter tabs.

**Narration:**
> *"Here is the OpsMind Incident Commander Cockpit. In the top bar, you can see live connection telemetry to our three isolated Hindsight memory banks: `opsmind-incidents`, `opsmind-services`, and `opsmind-runbooks`.*
> 
> *Unlike ordinary dashboards, OpsMind doesn't just display tickets. It maintains continuous cognitive models of our microservice architecture and actively monitors for recurring failure patterns."*

---

### [1:15 – 2:10] Scene 3: Stage 1 — The Cold-Start Outage
**Visual:**
- Click **"Run Benchmark Demo"** button.
- Select **"Trigger Stage 1: Cold Start"**.
- A new P1 incident appears: `payment-service: PodEvicted_MemoryStarvation`.
- Click on the incident to open the investigation cockpit.
- Show the Investigation Timeline:
  - Step 1 `TRIAGE`: Ingested Kubernetes OOM alert.
  - Step 2 `RECALL`: Hindsight search returns 0 matches (Cold Start).
  - Step 3 `REFLECT`: Exploratory hypotheses generated based on topology.
- Show the Memory Inspector panel on the right: `COLD START (NEW)`.
- Click **"Mark as Resolved"**.
- In the modal, confirm:
  - Root Cause: *"Redis cache eviction policy set to noeviction under high traffic"*.
  - Resolution: *"Applied config: maxmemory-policy volatile-lru and expanded cluster RAM"*.
- Click **"Retain & Resolve"**.
- Show toast: *"Successfully retained in Hindsight Memory bank `opsmind-incidents`"*.

**Narration:**
> *"Let's test OpsMind with a novel outage. We trigger Stage 1: a memory crash on `payment-service` caused by unevicted cache buffers.*
> 
> *Because this is the first time this failure mode has occurred, OpsMind queries Hindsight and confirms this is a cold-start event. It formulates baseline hypotheses, and our SRE investigates and applies the fix: switching the Redis eviction policy to `volatile-lru`.*
> 
> *When the engineer marks the incident resolved, OpsMind doesn't just close the ticket. It executes `hindsight.retain()`, extracting entities, temporal metadata, and updating the living reliability mental model for `payment-service`."*

---

### [2:10 – 3:00] Scene 4: Stage 2 — The Hindsight Advantage
**Visual:**
- Reopen the benchmark modal.
- Click **"Trigger Stage 2: Hindsight Advantage"**.
- A new alert fires 2 weeks later: `payment-service: LatencySpikeAndMemoryAlarm`.
- Click on the new incident.
- Show the instantaneous transformation:
  - Memory Inspector displays: **RECALL HIT (94% Similarity)** linked to Incident #1!
  - Investigation Step `RECALL` cites the exact previous incident, root cause, and fix.
  - Investigation Step `REFLECT` performs differential analysis confirming the cache eviction recurrence.
  - Guarded Remediation Terminal shows the pre-staged command:  
    `redis-cli config set maxmemory-policy volatile-lru`
- Hover over the **Risk Level: CAUTION** badge.
- Click **"Approve & Apply"**.
- Execution log flashes green: `[VERIFIED EXECUTION] Command applied successfully in production`.

**Narration:**
> *"Now, fast-forward two weeks. A new on-call engineer is on shift, and a recurring latency surge strikes `payment-service`.*
> 
> *Watch what happens: In under two seconds, OpsMind queries Hindsight via 4-way hybrid search and instantly recalls the Stage 1 incident with a 94% similarity score.*
> 
> *It explains why the symptoms match, references the prior post-mortem, and generates the exact validated remediation command. Notice that OpsMind respects strict Human-in-the-Loop guardrails: it never runs mutating commands autonomously.*
> 
> *With one click, the engineer reviews and approves the runbook. The issue is mitigated in seconds instead of hours."*

---

### [3:00 – 3:30] Scene 5: Conclusion & Real-World Impact
**Visual:**
- Zoom back to the dashboard metrics.
- Point out MTTR plummeting and Hindsight Recalls counter incremented.
- Display the GitHub repo URL and closing title card.

**Narration:**
> *"By turning post-incident resolutions into durable cognitive memory, OpsMind slashes Mean Time to Resolution and permanently protects engineering teams from recurring downtime.*
> 
> *OpsMind is open-source, fully tested, and ready for production DevOps teams.*
> 
> *Thank you."*

