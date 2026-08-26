# AI Emergency Response & Disaster Coordinator - Startup Guide

This document explains all methods to run the application on your computer:
1. **1-Click Batch Files (Recommended)**
2. **Manual Terminal Commands (PowerShell / Command Prompt)**

---

## ⚡ Method 1: 1-Click Launch (Batch Files)

In the root project folder (`AI Emergency Response & Disaster Coordinator`), you have three `.bat` files:

| File | What It Does |
| :--- | :--- |
| **`start_all.bat`** | **Starts both Backend + Frontend in separate windows and automatically opens Google Chrome / default browser at `http://localhost:5173`.** |
| **`start_backend.bat`** | Starts only the FastAPI Python backend server on `http://127.0.0.1:8000`. |
| **`start_frontend.bat`** | Starts only the React + Vite frontend server on `http://localhost:5173`. |

> **How to use**: Simply double-click `start_all.bat`.

---

## 💻 Method 2: Manual Terminal Commands

If you prefer to run the services manually using terminal windows:

### Terminal 1 — Start the Backend
1. Open PowerShell or Command Prompt.
2. Run the following command:
   ```powershell
   cd "c:\Users\karti\Desktop\AI Emergency Response & Disaster Coordinator\my-hackathon-project\backend"
   & "..\..\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
3. Backend will be live at: `http://127.0.0.1:8000`

---

### Terminal 2 — Start the Frontend
1. Open a second PowerShell or Command Prompt window.
2. Run the following command:
   ```powershell
   cd "c:\Users\karti\Desktop\AI Emergency Response & Disaster Coordinator\my-hackathon-project\frontend"
   node ./node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173
   ```
3. Frontend will be live at: `http://localhost:5173`

---

### Step 3 — Open the Application in Browser
Open Chrome and navigate to:
- **Web Application UI**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Swagger API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🔑 Future OpenAI API Key (Optional)

- The application is currently running with an **intelligent local heuristic triage engine** that requires **no API key**.
- To switch to OpenAI GPT-4o when you obtain an API key:
  1. Create a file named `.env` in `my-hackathon-project/backend/`
  2. Add:
     ```env
     OPENAI_API_KEY=sk-your-actual-key-here
     ```
  3. Restart the backend. It will automatically detect the key and upgrade to OpenAI GPT-4o.
