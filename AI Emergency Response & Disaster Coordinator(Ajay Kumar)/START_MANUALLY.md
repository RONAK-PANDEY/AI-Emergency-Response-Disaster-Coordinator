# 🚀 AI Emergency Response & Disaster Coordinator v2.5 - Startup Guide

This platform is organized into **two independent web applications** sharing the **same central database and AI engine**:

1. 👤 **Citizen Reporter Portal** (Port `5174`)
2. 🏛️ **Government Officer Command Portal** (Port `5175`)
3. 🔌 **Shared FastAPI Backend & AI Engine** (Port `8000`)

---

## ⚡ Method 1: 1-Click Launchers (Double-Click in Windows Explorer)

### Master Launchers (in Root Folder)
| File | Action | Description |
| :--- | :--- | :--- |
| **[`start_all.bat`](file:///c:/Users/AJAY%20KUMAR/Desktop/AI%20Emergency%20Response%20&%20Disaster%20Coordinator/start_all.bat)** | **Double-Click** | 🌟 **Starts EVERYTHING** (Shared Backend + Citizen Portal + Officer Portal) and opens both portals in your browser. |
| **[`start_reporter_portal.bat`](file:///c:/Users/AJAY%20KUMAR/Desktop/AI%20Emergency%20Response%20&%20Disaster%20Coordinator/start_reporter_portal.bat)** | **Double-Click** | Starts the **Citizen Reporter Portal** stack (Backend :8000 + Frontend :5174). |
| **[`start_officer_portal.bat`](file:///c:/Users/AJAY%20KUMAR/Desktop/AI%20Emergency%20Response%20&%20Disaster%20Coordinator/start_officer_portal.bat)** | **Double-Click** | Starts the **Government Officer Portal** stack (Backend :8000 + Frontend :5175). |
| **[`start_backend.bat`](file:///c:/Users/AJAY%20KUMAR/Desktop/AI%20Emergency%20Response%20&%20Disaster%20Coordinator/start_backend.bat)** | **Double-Click** | Starts only the shared FastAPI Backend Server on port `8000`. |

---

### Portal-Specific Folders
Each portal also has its own dedicated folder containing isolated launcher files:
- **`reporter-portal/`**:
  - `start_all.bat`
  - `start_frontend.bat` (Port 5174)
  - `start_backend.bat` (Port 8000)
  - `START_MANUALLY.md`
- **`officer-portal/`**:
  - `start_all.bat`
  - `start_frontend.bat` (Port 5175)
  - `start_backend.bat` (Port 8000)
  - `START_MANUALLY.md`

---

## 🛠️ Method 2: Manual Terminal Commands

### 1. Shared Backend API (Port 8000)
```cmd
cd "my-hackathon-project\backend"
venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Citizen Reporter Portal (Port 5174)
```cmd
cd "reporter-portal"
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174
```

### 3. Government Officer Portal (Port 5175)
```cmd
cd "officer-portal"
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175
```

---

## 🔑 Pre-Seeded Demo Credentials (1-Click Login Ready)

| Portal | Role | Identifier / Email | Password / OTP | Default Name / Title |
| :--- | :--- | :--- | :--- | :--- |
| **🏛️ Government Officer** | `officer` | `officer@punjab.gov.in` | `Admin@123` | **Insp. R. Sharma** *(State Emergency Lead)* |
| **🏛️ NDRF Dispatcher** | `officer` | `dispatch@punjab.gov.in` | `Admin@123` | **Officer Simran Gill** *(NDRF Dispatcher)* |
| **👤 Citizen Reporter** | `reporter` | `citizen@demo.in` | `123456` *(OTP)* | **Aarav Singh** *(Verified Citizen)* |

---

## 🧪 Verification & Build Status
- ✅ **Citizen Reporter Portal**: Vite production build passed (`dist/`, 0 errors) on port `5174`.
- ✅ **Government Officer Portal**: Vite production build passed (`dist/`, 0 errors) on port `5175`.
- ✅ **Shared Backend API Engine**: Validated on port `8000` with 8 end-to-end integration tests passed.
- ✅ **Launcher Scripts**: All `.bat` and `START_MANUALLY.md` files created and verified.
- ✅ **Smart Map Auto-Close**: Auto-closes split map whenever incident details, dispatch, resolve, telemetry, audit logs, or reviews drawers are opened.
- ✅ **Interactive EOC KPIs**: Dashboard cards filter the triage list and auto-close the map for rapid triage navigation.
- ✅ **Citizen Reviews Drawer**: New EOC drawer displaying detailed star ratings and feedback.

---

## 🌐 Application Access URLs

- 👤 **Citizen Reporter Portal**: [http://localhost:5174](http://localhost:5174)
- 🏛️ **Government Officer Portal**: [http://localhost:5175](http://localhost:5175)
- 🔌 **Shared FastAPI Backend Status**: [http://localhost:8000](http://localhost:8000)
- 📖 **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
