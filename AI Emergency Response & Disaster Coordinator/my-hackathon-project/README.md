# AI Emergency Response & Disaster Coordinator

A full-stack hackathon-ready project with a FastAPI backend and React frontend for emergency incident reporting, classification, and dispatch tracking.

## Project structure

```text
my-hackathon-project/
├── .gitignore
├── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   ├── app/
│   ├── tests/
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   └── incidents.db
└── .venv/
```

## Quick start

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Then open the Vite frontend URL shown in the terminal, usually http://localhost:5173.

## Backend endpoints

- `GET /api/ping` — health check
- `POST /api/report` — create incident report
- `GET /api/incidents` — list incidents
- `PATCH /api/incidents/{incident_id}` — update incident status

## Notes

- The frontend is designed to work against the local FastAPI backend at `http://localhost:8000`.
- The backend stores data in SQLite using SQLAlchemy.
- You can set optional AI keys in `backend/.env` or `backend/.env.example`.
