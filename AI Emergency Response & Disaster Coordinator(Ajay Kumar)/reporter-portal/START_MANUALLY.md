# 👤 Citizen Emergency Reporter Portal - Startup Guide

This guide explains how to start and operate the **Independent Citizen Emergency Reporter Portal**.

---

## ⚡ Method 1: 1-Click Launchers (Double-Click in Windows Explorer)

You can launch the portal by double-clicking the batch files in this folder:

| File | Action | Description |
| :--- | :--- | :--- |
| **`start_all.bat`** | **Double-Click** | 🌟 **Starts both Backend (:8000) and Citizen Frontend (:5174)** in separate windows and automatically opens `http://localhost:5174` in your browser. |
| **`start_backend.bat`** | **Double-Click** | Starts only the shared FastAPI Backend Server on port `8000`. |
| **`start_frontend.bat`** | **Double-Click** | Starts only the Citizen React + Vite Frontend Server on port `5174`. |

---

## 🛠️ Method 2: Manual Terminal Commands

### Step 1: Start Backend (Port 8000)
Open Command Prompt or PowerShell:
```cmd
cd "..\my-hackathon-project\backend"
venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 2: Start Citizen Frontend (Port 5174)
Open a second Command Prompt:
```cmd
cd "reporter-portal"
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174
```

---

## 🔑 Pre-Seeded Citizen Demo Credentials
- **Email/Phone**: `citizen@demo.in`
- **Demo OTP**: `123456`
- **Name**: `Aarav Singh` (Verified Citizen Reporter)
- *1-Click Demo Login button available in the portal header.*

---

## 🌐 Application URLs
- **Citizen Portal Web App**: [http://localhost:5174](http://localhost:5174)
- **Shared Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
