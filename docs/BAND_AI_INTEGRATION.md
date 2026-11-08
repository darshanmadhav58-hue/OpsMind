# Band AI Desktop Integration Guide

## Overview
Band AI Desktop is a desktop workspace coordinator for managing, observing, and orchestrating autonomous coding and engineering agents. OpsMind provides direct configuration compatibility with Band AI Desktop through [`band.config.json`](../band.config.json).

---

## 1. Band AI Desktop Configuration
The root [`band.config.json`](../band.config.json) registers OpsMind's agent services, health probes, and capabilities:
- **Backend Service**: FastAPI SRE Agent Engine running on `http://localhost:8000`.
- **Frontend Service**: React + Vite SRE Incident Commander Cockpit on `http://localhost:5173`.
- **Health Check Probe**: `http://localhost:8000/api/v1/health`.

---

## 2. Using OpsMind inside Band AI Desktop
1. Download and open **Band AI Desktop** on your workstation.
2. Open the project folder: `OPS MIND` (`c:\Users\Darshan\Desktop\OPS MIND`).
3. Band AI Desktop detects `band.config.json` and registers the OpsMind SRE Agent.
4. You can use Band AI Desktop to orchestrate collaborative agent workflows:
   - **Triage Agent (OpsMind)**: Ingests alerts, queries Hindsight memory, and generates RCA.
   - **Fix/Patch Agent (Band AI Agent / Claude Code / Copilot)**: Receives the confirmed root cause from OpsMind and drafts the code fix in the repository.
   - **Verification Agent**: Runs the test suite to verify the fix before SRE approval.

