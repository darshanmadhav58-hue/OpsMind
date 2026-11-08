# OpsMind System Architecture

## Overview
OpsMind is an autonomous AI-powered Incident Response Agent designed for Site Reliability Engineering (SRE) and DevOps teams. Unlike stateless assistants or basic vector-search RAG implementations, OpsMind uses **Vectorize Hindsight persistent memory** as its core cognitive substrate to eliminate operational amnesia across on-call rotations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INGESTION & TELEMETRY                           │
│  - Prometheus / Datadog / PagerDuty Webhooks                           │
│  - Deterministic SRE Chaos & Benchmark Scenarios                       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   OPSMIND AGENT CORE (FastAPI Engine)                  │
│                                                                        │
│   ┌─────────────────────┐               ┌──────────────────────────┐   │
│   │   Triage Engine     │               │  Investigation & RCA     │   │
│   │   (P1-P4 Classifier)│               │  (Causal Reasoning)      │   │
│   └──────────┬──────────┘               └────────────▲─────────────┘   │
│              │                                       │                 │
│              ▼                                       │                 │
│   ┌──────────────────────────────────────────────────┴─────────────┐   │
│   │                      Guarded Action Planner                    │   │
│   │              (Human-in-the-Loop Safe Approval Gate)            │   │
│   └──────────────────────────────────┬─────────────────────────────┘   │
│                                      │                                 │
│                                      ▼                                 │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                     Post-Mortem Synthesizer                    │   │
│   └──────────────────────────────────┬─────────────────────────────┘   │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌────────────────────────────────────────┐  ┌────────────────────────────┐
│      HINDSIGHT PERSISTENT MEMORY       │  │     OPERATIONAL STATE      │
│         (Vectorize Cognitive Core)     │  │    (SQLite / SQLAlchemy)   │
│                                        │  │                            │
│  • opsmind-incidents                   │  │  • Incident Tickets        │
│  • opsmind-services                    │  │  • Investigation Steps     │
│  • opsmind-runbooks                    │  │  • Remediation Actions     │
│  • Living Service Mental Models        │  │  • Audit Logs              │
│  • 4-Way Hybrid Recall & Reflection    │  │                            │
└────────────────────────────────────────┘  └────────────────────────────┘
```

---

## 1. Architectural Separation: State vs Cognitive Memory
A key architectural principle in OpsMind is the strict separation between:
- **Operational State**: Stored in a relational database (SQLite via SQLAlchemy). Tracks ticket metadata, severity, status state machine (`TRIGGERED` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `MITIGATING` $\rightarrow$ `RESOLVED`), and immutable audit trails.
- **Cognitive Memory**: Stored in **Vectorize Hindsight memory banks**. Tracks associative relationships, failure precedents, causal hypotheses, graph entities, temporal decay, and synthesized mental models.

---

## 2. Memory Bank Isolation Strategy

OpsMind maintains three isolated Hindsight memory banks:

| Memory Bank | Purpose | Extraction Strategy |
| :--- | :--- | :--- |
| `opsmind-incidents` | Historical outage records, confirmed root causes, post-mortems, and applied mitigations. | Retained on resolution with entity tags (`service`, `component`, `policy`, `error`). |
| `opsmind-services` | System architecture topology, microservice tiers, upstream/downstream dependencies, and baseline limits. | Seeded at initialization and updated when topology shifts. |
| `opsmind-runbooks` | Guarded SRE mitigation procedures and validated command sets. | Retained when an engineer confirms a successful mitigation. |

---

## 3. The 4-Way Hybrid Retrieval Engine (`recall`)
When an alert arrives, OpsMind queries Hindsight using a 4-way hybrid retrieval ladder:
1. **Semantic Vector Search**: Captures high-level symptoms (e.g., "memory starvation", "elevated latencies").
2. **BM25 Keyword Matching**: Matches exact error codes, exception names, and pod identifiers (`OOMKilled`, `504 Gateway Timeout`).
3. **Knowledge Graph Traversal**: Traverses dependency chains (e.g., `checkout-service` $\rightarrow$ `redis-cache-cluster`).
4. **Temporal Context**: Evaluates recent deployments, previous shift incidents, and seasonal peak traffic patterns.

---

## 4. Human-in-the-Loop Guardrail
OpsMind strictly disallows automated execution of destructive or mutating production commands. 
- All synthesized runbook steps are assigned a **Risk Level** (`SAFE`, `CAUTION`, `HIGH`).
- Proposed commands are rendered in a guarded terminal drawer.
- Execution requires explicit on-call engineer review and sign-off.
- Full audit logs capture the actor, timestamp, and command output.

