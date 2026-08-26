# SEOC Punjab — Quick Start Guide

## 🚀 One-Click Launch

Double-click **`start_all.bat`** in the project root to start everything at once.

---

## Portals & Credentials

| Service | URL | Notes |
|---|---|---|
| **Citizen Reporter** | http://127.0.0.1:5173 | Aadhaar e-KYC or Anonymous mode |
| **Officer Console** | http://127.0.0.1:5174 | Login required (see below) |
| **Backend API Docs** | http://127.0.0.1:8000/docs | Swagger UI |

### Officer Login Credentials
| ID | PIN | Role |
|---|---|---|
| `OFFICER1` | `1234` | Chief Dispatcher — Gurpreet Singh |
| `OFFICER2` | `5678` | State Disaster Coordinator — Raman Sharma |
| `ADMIN` | `0000` | Commandant HQ — Sukhwinder |

---

## Individual Launchers
- **`start_backend.bat`** — FastAPI server on port 8000
- **`start_reporter.bat`** — Citizen Portal on port 5173
- **`start_officer.bat`** — Officer Console on port 5174

---

## Manual Terminal Start

**Terminal 1 — Backend:**
```powershell
cd "AI Emergency Response & Disaster Coordinator"
.\.venv\Scripts\Activate.ps1
cd my-hackathon-project\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Reporter Portal:**
```powershell
cd "AI Emergency Response & Disaster Coordinator\my-hackathon-project\frontend_reporter"
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
```

**Terminal 3 — Officer Portal:**
```powershell
cd "AI Emergency Response & Disaster Coordinator\my-hackathon-project\frontend_officer"
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174
```

---

*Disaster Management Act, 2005 — Section 33(b) | NIC/MeitY Compliant | v3.0.0-PROD*
