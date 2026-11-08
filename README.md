# OpsMind: Intelligent Incident Response & Persistent Memory AI

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Hindsight Memory](https://img.shields.io/badge/Hindsight-Vectorize%20Core-8B5CF6.svg?style=flat)](https://github.com/vectorize-io/hindsight)
[![Tests Passing](https://img.shields.io/badge/Tests-17%2F17%20Passing-10B981.svg?style=flat)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

OpsMind is an enterprise-grade AI Incident Response Agent designed for Site Reliability Engineering (SRE) and DevOps teams. It cures **operational amnesia** across on-call rotations by making **Vectorize Hindsight persistent memory** central to how production incidents are investigated, correlated, and resolved.

---

## The Problem: Operational Amnesia in SRE
When production systems crash at 3 AM, engineers waste hours diagnosing recurring problems, searching old incident channels, and repeating troubleshooting steps because institutional context is lost across shift rotations.

Standard vector search (naive RAG) fails in operational environments because it lacks:
- **Temporal Context**: Does not know when deployments or config drift occurred.
- **Topological Causal Graphs**: Cannot trace cascading failures across microservice tiers.
- **Continuous Learning**: Stateless chat sessions forget confirmed resolutions immediately upon closing.

## The OpsMind Solution
OpsMind acts as an intelligent virtual SRE teammate:
1. **Hybrid 4-Way Recall**: Queries Hindsight using semantic similarity, exact BM25 keyword matching, dependency graph traversal, and temporal recency.
2. **Autonomous Reflection**: Compares live telemetry against historical post-mortems to distinguish confirmed root causes from speculative hypotheses.
3. **Guarded Remediation**: Synthesizes verified runbook steps with explicit **Human-in-the-Loop** approval gates.
4. **Continuous Learning**: Retains confirmed post-mortems into Hindsight upon resolution, refreshing pre-computed **Mental Models** of service reliability.

---

## System Architecture

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

## Core Capabilities

### A. Incident Management
- Real-time alert ingestion from Prometheus, Datadog, and webhook payloads.
- Severity classification (P1 Critical through P4 Low).
- Lifecycle state transitions: `TRIGGERED` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `MITIGATING` $\rightarrow$ `RESOLVED`.
- Complete audit trails recording all actions, timestamps, and actors.

### B. AI Incident Investigation
- Live log parsing and error stack decomposition.
- Topology-aware causal hypothesis generation.
- Explicit distinction between **Confirmed Root Causes** and **Suspected Hypotheses**.

### C. Hindsight Persistent Memory (Core Feature)
- Uses actual Hindsight memory banks: `opsmind-incidents`, `opsmind-services`, `opsmind-runbooks`.
- Native execution of `retain()`, `recall()`, and `reflect()`.
- Continuous background maintenance of service **Mental Models**.

### D. Human-in-the-Loop Guardrail
- Automated execution of destructive commands is strictly blocked.
- Remediation actions display clear **Risk Levels** (`SAFE`, `CAUTION`, `HIGH`).
- Requires authenticated engineer sign-off in a guarded execution terminal.

---

## The Golden Demonstration: Proving Memory in Action

OpsMind includes a built-in, deterministic two-stage benchmark demonstrating the clear value of persistent memory:

| Benchmark Stage | Behavior | Memory Activity |
| :--- | :--- | :--- |
| **Stage 1: Cold Start** | Novel outage on `payment-service`. OpsMind detects zero prior precedent, guides exploratory triage. SRE confirms root cause (`Redis cache eviction policy`) and applies fix. | Calls `retain()`, extracting entities and refreshing the service mental model. |
| **Stage 2: Recurrent Outage** | Similar latency and memory alarm fires 2 weeks later. OpsMind automatically recalls Stage 1 in <2s with 94% similarity. | Calls `recall()` and `reflect()`. Recommends the proven fix (`volatile-lru`) in a guarded terminal for instant approval. |

---

## Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Create & activate virtual environment (Windows)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run backend API server (runs on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
# Navigate to frontend (in a separate terminal)
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

### 3. Run Automated Tests
```bash
# Run complete test suite (unit tests, API tests, and Hindsight memory tests)
.\backend\.venv\Scripts\pytest.exe -c backend/pytest.ini -v
```
All 17 tests pass with 100% success rate.

---

## Project Structure
```
OPS MIND/
├── backend/
│   ├── app/
│   │   ├── api/             # Health, Incidents, and Memory REST endpoints
│   │   ├── core/            # App settings, secrets, and logging
│   │   ├── db/              # SQLAlchemy SQLite models & session
│   │   ├── memory/          # HindsightService (retain, recall, reflect, banks)
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── services/        # AI Investigator & Learning Engine
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/
│   │   ├── test_api.py      # REST API tests
│   │   └── test_hindsight_memory.py # Retain/recall/reflect verification tests
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # SRE Cockpit UI components
│   │   ├── services/        # Typed API client
│   │   ├── types/           # TypeScript schemas
│   │   ├── App.tsx          # Master layout
│   │   └── index.css        # Enterprise dark theme
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── scenarios/               # Deterministic demo incident datasets
├── docs/
│   ├── ARCHITECTURE.md      # Detailed system design
│   ├── HINDSIGHT_INTEGRATION.md # Hindsight memory architecture
│   ├── ARTICLE_DRAFT.md     # Public technical article (~1,350 words)
│   ├── LINKEDIN_POST.md     # Social post & comment drafts
│   └── DEMO_SCRIPT.md       # 2-5 min walkthrough script
└── README.md
```

---

## Submission Deliverables & Documentation
- **Technical Article**: [docs/ARTICLE_DRAFT.md](docs/ARTICLE_DRAFT.md) (~1,350 words, calibrated to satisfy the 800–1,500 vs 1,200–2,000 word discrepancy).
- **LinkedIn Social Post**: [docs/LINKEDIN_POST.md](docs/LINKEDIN_POST.md) (with GitHub link and first-comment Hindsight repository link).
- **Video Walkthrough Script**: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) (timed 3:30 script with scene-by-scene visual cues).
- **Architecture Blueprint**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Memory Integration Guide**: [docs/HINDSIGHT_INTEGRATION.md](docs/HINDSIGHT_INTEGRATION.md).

---

## License
MIT License. Built for the Vectorize Hindsight competition.

