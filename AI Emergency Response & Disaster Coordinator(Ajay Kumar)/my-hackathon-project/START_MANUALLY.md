# 🚀 AI Emergency Response & Disaster Coordinator - Startup Guide

This document provides complete instructions for starting both the **Backend API** and **Frontend UI** of the AI Emergency Response & Disaster Coordinator system.

---

## ⚡ Method 1: 1-Click Launchers (Recommended)

You can launch the entire stack or individual components simply by double-clicking the batch (`.bat`) files in this folder or the project root:

| File | Action | Description |
| :--- | :--- | :--- |
| **`start_all.bat`** | Double-Click | 🌟 **Starts both Backend & Frontend** in two separate windows and automatically opens your browser to `http://localhost:5173`. |
| **`start_backend.bat`** | Double-Click | Starts only the **FastAPI Backend server** on port 8000 with auto-reload and Swagger UI. |
| **`start_frontend.bat`** | Double-Click | Starts only the **React + Vite Frontend server** on port 5173. |

> **Tip:** You can keep both command windows open while testing. If you make changes to the code, FastAPI and Vite will automatically hot-reload!

---

## 🛠️ Method 2: Manual Terminal Startup

If you prefer to start each component manually via Command Prompt or PowerShell, follow the steps below:

### 1. Start the Backend API (FastAPI)

Open a terminal window and execute:

```cmd
# 1. Navigate to the backend directory
cd backend

# 2. (Optional - if venv doesn't exist) Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# On Command Prompt (cmd.exe):
venv\Scripts\activate.bat
# On PowerShell:
.\venv\Scripts\Activate.ps1

# 4. Install dependencies (if not already installed)
pip install -r requirements.txt

# 5. Launch the FastAPI server with live reload
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 2. Start the Frontend Application (React + Vite)

Open a **second** terminal window and execute:

```cmd
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Launch the Vite development server
node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
```
*(Alternatively, you can run `npm run dev`)*

---

## 🌐 Application URLs & Endpoints

Once running, access the services at:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Main Emergency Coordinator Dashboard & Citizen Report Portal |
| **Backend API Root** | [http://localhost:8000](http://localhost:8000) | Backend service status and health checks |
| **Swagger Interactive Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive API testing interface (OpenAPI) |
| **ReDoc API Documentation** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Clean, detailed API reference documentation |

---

## ⚙️ Configuration & Environment Variables

### Backend Configuration
Located in: `backend/app/core/config.py` or `.env`
- **Database**: SQLite database automatically created at `backend/incidents.db`.
- **Uploads**: Image uploads are saved in `backend/uploads/`.
- **OpenAI API Key**: To enable live AI classification & GPT-4o vision analysis, set your OpenAI API key in `backend/.env`:
  ```env
  OPENAI_API_KEY=your_openai_api_key_here
  ```

---

## 🔧 Troubleshooting

### 1. PowerShell Script Execution Policy Error
If you see an error like: `File ... cannot be loaded because running scripts is disabled on this system`
- **Solution A**: Use the provided `.bat` files (`start_all.bat`, `start_backend.bat`, `start_frontend.bat`) by double-clicking them in Windows Explorer.
- **Solution B**: In PowerShell, run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```

### 2. Port Already in Use (Port 8000 or 5173)
If port 8000 or 5173 is occupied by another process:
- Check what process is using port 8000:
  ```cmd
  netstat -ano | findstr :8000
  ```
- Terminate the conflicting process:
  ```cmd
  taskkill /PID <PID_NUMBER> /F
  ```

### 3. Folder Path with Ampersand (`&`) Character
On Windows, folder paths containing `&` (such as `AI Emergency Response & Disaster Coordinator`) can cause batch files or npm scripts to split commands unexpectedly.
- The included `start_backend.bat`, `start_frontend.bat`, and `start_all.bat` scripts have been specifically hardened with full quoting and direct module invocation to prevent ampersand parsing issues.
