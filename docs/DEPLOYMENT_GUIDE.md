# OpsMind Production Deployment Guide

This guide provides end-to-end instructions for deploying OpsMind into production environments.

---

## Deployment Option 1: Docker Compose (Self-Hosted / Single Server)

The fastest way to deploy the entire OpsMind stack (FastAPI backend + React frontend + persistent volume):

```bash
# 1. Clone repository
git clone https://github.com/your-username/opsmind.git
cd opsmind

# 2. Build and start containers in background
docker compose up -d --build

# 3. Verify health
curl -f http://localhost:8000/api/v1/health

# 4. Open in browser
# Frontend Cockpit: http://localhost:5173
# Backend API Docs: http://localhost:8000/docs
```

---

## Deployment Option 2: Render / Railway (Cloud PaaS)

### A. Deploy Backend on Render / Railway
1. Create a new **Web Service** pointing to `backend/`.
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**:
   - `DATABASE_URL`: `sqlite:///./opsmind.db` (or attach a managed PostgreSQL instance)
   - `GEMINI_API_KEY`: *(Optional)* Your Google GenAI Gemini API key
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `HINDSIGHT_BASE_URL`: `http://localhost:8888` (or your Hindsight Cloud URL)
   - `HINDSIGHT_API_KEY`: *(Optional)* Your Vectorize Hindsight API key

### B. Deploy Frontend on Vercel / Render Static Site
1. Create a new project pointing to `frontend/`.
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. Set proxy or rewrite `/api/*` to your live Backend URL.

---

## Deployment Option 3: Fly.io (Container Cloud)

```bash
# Deploy backend
cd backend
fly launch --name opsmind-api
fly deploy

# Deploy frontend
cd ../frontend
fly launch --name opsmind-ui
fly deploy
```

---

## Production Security Checklist
- [x] Secrets stored exclusively in environment variables (never committed to Git).
- [x] CORS origins restricted to approved production domains.
- [x] SQLite volume mounted to persistent block storage (`/app/data`).
- [x] Read-only / Non-destructive command guardrails enforced by default.
- [x] Strict Human-in-the-Loop signature required for all remediation actions.

