@echo off
REM Setup script for Emergency Response Coordinator (Windows)

setlocal enabledelayedexpansion

echo 🚀 Setting up Emergency Response Discipline Coordinator...

REM Backend setup
echo.
echo 📦 Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
pip install -r requirements.txt

REM Copy environment file if it doesn't exist
if not exist ".env" (
    copy .env.example .env
    echo ⚠️  Created .env file - please update OPENAI_API_KEY
)

REM Initialize database
echo 🗄️  Initializing database...
python seed.py

cd ..

REM Frontend setup
echo.
echo 📦 Setting up frontend...
cd frontend

REM Install dependencies
call npm install

REM Copy environment file if it doesn't exist
if not exist ".env" (
    copy .env.example .env
)

cd ..

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Update backend\.env with your OPENAI_API_KEY
echo 2. Start backend: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo 3. Start frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 Frontend: http://localhost:5173
echo 📚 Backend API Docs: http://localhost:8000/docs

pause
