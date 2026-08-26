# Quick Start Guide

## Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API Key

## Quick Start (5 minutes)

### 1. Run Setup Script

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
bash setup.sh
```

### 2. Add OpenAI API Key

Edit `backend/.env`:
```
OPENAI_API_KEY=sk-your-key-here
```

### 3. Start Backend

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

### 4. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

### 5. Access the Application

- 🌐 Frontend: http://localhost:5173
- 📚 API Docs: http://localhost:8000/docs

## Manual Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env and add OPENAI_API_KEY

# Initialize database
python seed.py

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run dev server
npm run dev
```

## Features

### 🎯 Report an Incident
- Describe the emergency
- Share GPS location
- Upload photo (optional)
- System automatically classifies using AI

### 🗺️ Live Map
- View all incidents in real-time
- Color-coded by severity
- Click for details

### 📊 Admin Dashboard
- Table view of all incidents
- Sort and filter by severity/status
- See people affected and team requirements

### 📈 Stats Bar
- Total active incidents
- Critical/High/Medium/Low counts
- Real-time updates

## API Endpoints

```
POST /api/report              - Submit new report
GET  /api/incidents           - List all incidents
GET  /api/incidents/{id}      - Get incident details
PATCH /api/incidents/{id}     - Update incident status
GET  /api/health              - Health check
GET  /api/ping                - Ping
```

## Database Seeding

The `backend/seed.py` script populates the database with 20 realistic sample incidents across Punjab, India.

To reseed:
```bash
cd backend
python seed.py
```

## Troubleshooting

### Port Already in Use
- Backend default: 8000
- Frontend default: 5173

Change ports:
```bash
# Backend
uvicorn app.main:app --port 8001

# Frontend - edit vite.config.js or use
npm run dev -- --port 5174
```

### OpenAI API Errors
- Check API key is valid
- Check account has credits
- Verify model is gpt-4o

### Database Errors
- Delete `backend/incidents.db` to reset
- Run `python seed.py` again

### CORS Errors
- Ensure backend runs on http://localhost:8000
- Check frontend .env has correct API URL

## Production Deployment

### Backend (Gunicorn)
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -b 0.0.0.0:8000
```

### Frontend (Static Files)
```bash
npm run build
# Serve dist/ folder with any web server (nginx, Apache, etc.)
```

### Database
- Use PostgreSQL for production
- Update DATABASE_URL in .env
- Run migrations/init_db() on startup

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review .env.example files for configuration options
3. Check backend API docs at http://localhost:8000/docs
4. Open an issue on GitHub
