# 🏛️ Government Officer Command Portal - Startup Guide

This guide explains how to start and operate the **Independent Government Officer Command Portal (State Emergency Operations Centre)**.

---

## ⚡ Method 1: 1-Click Launchers (Double-Click in Windows Explorer)

You can launch the portal by double-clicking the batch files in this folder:

| File | Action | Description |
| :--- | :--- | :--- |
| **`start_all.bat`** | **Double-Click** | 🌟 **Starts both Backend (:8000) and Officer Frontend (:5175)** in separate windows and automatically opens `http://localhost:5175` in your browser. |
| **`start_backend.bat`** | **Double-Click** | Starts only the shared FastAPI Backend Server on port `8000`. |
| **`start_frontend.bat`** | **Double-Click** | Starts only the Officer React + Vite Frontend Server on port `5175`. |

---

## 🛠️ Method 2: Manual Terminal Commands

### Step 1: Start Backend (Port 8000)
Open Command Prompt or PowerShell:
```cmd
cd "..\my-hackathon-project\backend"
venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 2: Start Officer Frontend (Port 5175)
Open a second Command Prompt:
```cmd
cd "officer-portal"
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175
```

---

## 🔑 Pre-Seeded Officer Demo Credentials
- **Official Email**: `officer@punjab.gov.in`
- **Password**: `Admin@123`
- **Designation**: `Insp. R. Sharma` (State Emergency Coordinator)
- *1-Click Demo Login button available in the portal.*

---

## 🌐 Application URLs
- **Officer Command Center**: [http://localhost:5175](http://localhost:5175)
- **Shared Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
