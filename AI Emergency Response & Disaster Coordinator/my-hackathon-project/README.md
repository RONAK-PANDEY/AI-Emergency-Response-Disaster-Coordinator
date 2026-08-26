# AI Emergency Response & Disaster Coordinator

A hackathon-ready monorepo with a FastAPI backend and Vite + React frontend for reporting and tracking emergency incidents.

## Project structure

- `backend/` — FastAPI API and SQLite database
- `frontend/` — React dashboard and citizen report form

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## Default app flow

- Citizen form submits report to `POST /api/report`
- Backend stores the incident and returns the saved record
- Frontend fetches incidents from `GET /api/incidents`
- Dashboard displays severity and status cards

## API

- `GET /api/ping`
- `POST /api/report`
- `GET /api/incidents`
- `PATCH /api/incidents/{incident_id}`
