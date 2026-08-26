# 📁 Complete Project Structure

## Root Directory

```
my-hackathon-project/
├── .gitignore                          # Git ignore rules
├── README.md                           # Main documentation
├── QUICKSTART.md                       # 5-minute setup guide
├── ARCHITECTURE.md                     # System design & integration
├── DEPLOYMENT.md                       # Production deployment guide
├── PROJECT_COMPLETE.md                 # Completion summary
├── setup.sh                            # Linux/Mac setup script
├── setup.bat                           # Windows setup script
├──
├── backend/                            # FastAPI Backend (Python)
│   ├── .gitignore
│   ├── .env.example
│   ├── requirements.txt
│   ├── database.py                     # Database & session setup
│   ├── seed.py                         # Sample data initialization
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py                     # FastAPI application entry
│       │
│       ├── models/
│       │   ├── __init__.py
│       │   └── incident.py             # SQLAlchemy models (Incident, Report)
│       │
│       ├── schemas/
│       │   ├── __init__.py
│       │   └── incident.py             # Pydantic validation schemas
│       │
│       ├── api/
│       │   ├── __init__.py
│       │   ├── incidents.py            # REST endpoint handlers
│       │   └── routes/
│       │       └── __init__.py
│       │
│       ├── services/
│       │   ├── __init__.py             # AI text classification
│       │   └── image_analyzer.py       # Vision analysis service
│       │
│       └── core/
│           ├── __init__.py
│           └── config.py               # Settings & configuration
│
└── frontend/                           # React/TypeScript Frontend
    ├── .gitignore
    ├── .env.example
    ├── index.html                      # HTML entry point
    ├── package.json                    # Dependencies
    ├── tsconfig.json                   # TypeScript config
    ├── tsconfig.node.json              # TypeScript Node config
    ├── vite.config.js                  # Vite build config
    ├── tailwind.config.js              # Tailwind CSS config
    ├── postcss.config.js               # PostCSS config
    │
    ├── public/                         # Static assets
    │
    └── src/
        ├── main.jsx                    # React entry point
        ├── App.jsx                     # Main app component
        ├── index.css                   # Global styles
        │
        ├── components/                 # Reusable components
        │   ├── AdminDashboard.tsx      # Admin dashboard table
        │   ├── ReportForm.tsx          # Report submission form
        │   ├── EmergencyMap.tsx        # Live map visualization
        │   └── StatsBar.tsx            # Statistics component
        │
        └── pages/                      # Page components
            └── Dashboard.tsx           # Main dashboard page
```

## File Descriptions

### Root Files

| File | Purpose |
|------|---------|
| `.gitignore` | Ignore rules for Git |
| `README.md` | Comprehensive project documentation |
| `QUICKSTART.md` | Quick setup guide (5 minutes) |
| `ARCHITECTURE.md` | System design & component integration |
| `DEPLOYMENT.md` | Production deployment guide |
| `PROJECT_COMPLETE.md` | Completion summary & features |
| `setup.sh` | Automated setup for Unix/Linux/Mac |
| `setup.bat` | Automated setup for Windows |

### Backend Files

#### Core Application (`backend/app/main.py`)
- FastAPI application initialization
- CORS middleware setup
- Database initialization
- Route registration
- Upload directory setup

#### Models (`backend/app/models/incident.py`)
- `Incident` - Database model for incidents
- `Report` - Database model for reports
- Enums: `IncidentType`, `IncidentSeverity`, `IncidentStatus`
- Relationships and cascading deletes

#### Schemas (`backend/app/schemas/incident.py`)
- `ReportCreate` - Request validation
- `IncidentOut` - Response serialization
- `IncidentStatusUpdate` - Status update validation
- `IncidentListOut` - List response format

#### Services (`backend/app/services/`)
- `__init__.py` - Text classification using GPT-4o
- `image_analyzer.py` - Vision analysis using GPT-4o

#### API Routes (`backend/app/api/incidents.py`)
- `POST /api/report` - Create incident
- `GET /api/incidents` - List incidents
- `GET /api/incidents/{id}` - Get incident
- `PATCH /api/incidents/{id}` - Update status
- `GET /api/health` - Health check
- `GET /api/ping` - Ping test

#### Configuration (`backend/app/core/config.py`)
- Settings from environment variables
- Database URL
- OpenAI API configuration
- CORS origins
- Upload directory

#### Database (`backend/database.py`)
- SQLAlchemy engine setup
- Session factory
- Database initialization
- Session dependency for FastAPI

#### Seeding (`backend/seed.py`)
- Populates database with 20 sample incidents
- Realistic Punjab emergency scenarios
- Mix of types and severities

#### Dependencies (`backend/requirements.txt`)
- FastAPI, Uvicorn
- SQLAlchemy
- Pydantic
- OpenAI client
- And more...

### Frontend Files

#### Entry Points
- `index.html` - HTML template
- `src/main.jsx` - React DOM entry
- `src/App.jsx` - App component with routing

#### Configuration
- `package.json` - Dependencies & scripts
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind theme & extensions
- `tsconfig.json` - TypeScript configuration
- `postcss.config.js` - PostCSS plugins

#### Components (`src/components/`)

**AdminDashboard.tsx**
- Displays incidents in sortable table
- Filter and sort capabilities
- Modal detail view
- Real-time polling
- Severity color coding

**ReportForm.tsx**
- Emergency report submission
- GPS location sharing
- Image upload
- Form validation
- Success/error feedback

**EmergencyMap.tsx**
- Leaflet map visualization
- Color-coded severity markers
- Popup incident details
- Real-time polling
- OpenStreetMap tiles

**StatsBar.tsx**
- Statistics cards
- Active incident count
- Breakdown by severity
- Real-time updates

#### Pages (`src/pages/`)

**Dashboard.tsx**
- Main container component
- Navigation between views
- Data fetching & polling
- Props passing to components

#### Styles
- `src/index.css` - Global styles & Tailwind directives

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│               User Interface                             │
│  Dashboard | Map | Report Form | Stats Bar              │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP REST API
                  │ (JSON)
                  ↓
┌─────────────────────────────────────────────────────────┐
│               FastAPI Backend                            │
│  app/api/incidents.py - Route Handlers                  │
└────┬────────────────────────────┬──────────────────┬────┘
     │                            │                  │
     ↓                            ↓                  ↓
  Database              AI Classification      Image Analysis
  (SQLAlchemy)         (GPT-4o Text)           (GPT-4o Vision)
     │                            │                  │
     ↓                            ↓                  ↓
incidents.db           classify_emergency()   analyze_image()
reports table          JSON response          JSON response
     │                            │                  │
     └────────────────┬───────────┴──────────────────┘
                      │
                      ↓
                  Response to Frontend
                      │
                      ↓
                Update React State
                      │
                      ↓
            Re-render Components
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./incidents.db
OPENAI_API_KEY=sk-your-key-here
UPLOAD_DIR=./uploads
SQLALCHEMY_ECHO=false
CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## API Endpoints Summary

### Incidents API
```
POST   /api/report              Create incident
GET    /api/incidents           List incidents
GET    /api/incidents/{id}      Get incident
PATCH  /api/incidents/{id}      Update status
```

### Health & Status
```
GET    /api/health              Health check
GET    /api/ping                Ping test
GET    /                        Root/info
```

### API Documentation
```
GET    /docs                    Interactive API docs (Swagger)
GET    /redoc                   Alternative API docs
```

## Database Schema

### Incidents Table
```sql
CREATE TABLE incidents (
    id INTEGER PRIMARY KEY,
    type VARCHAR NOT NULL,           -- fire, flood, accident, medical, etc.
    severity VARCHAR NOT NULL,       -- critical, high, medium, low
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    description TEXT NOT NULL,
    people_affected INTEGER DEFAULT 0,
    status VARCHAR NOT NULL,         -- new, reported, investigating, etc.
    created_at DATETIME DEFAULT NOW
);

CREATE INDEX idx_severity ON incidents(severity);
CREATE INDEX idx_status ON incidents(status);
CREATE INDEX idx_created_at ON incidents(created_at);
```

### Reports Table
```sql
CREATE TABLE reports (
    id INTEGER PRIMARY KEY,
    incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    image_path VARCHAR,
    created_at DATETIME DEFAULT NOW
);

CREATE INDEX idx_incident_id ON reports(incident_id);
```

## Build & Run Commands

### Backend
```bash
# Development
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Production
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
# Development
cd frontend
npm install
npm run dev

# Production
npm run build
npm run preview
```

## Deployment Targets

The project structure supports:
- ✅ Local development
- ✅ Docker containerization
- ✅ Heroku deployment
- ✅ Railway deployment
- ✅ AWS deployment
- ✅ Vercel (frontend)
- ✅ Netlify (frontend)
- ✅ Traditional VPS
- ✅ Cloud run (Google)
- ✅ Azure App Service

See `DEPLOYMENT.md` for detailed instructions.

## Key Integration Points

1. **Frontend → Backend**
   - `fetch(http://localhost:8000/api/...)`
   - JSON request/response
   - CORS enabled

2. **Backend → AI Services**
   - OpenAI API key from .env
   - GPT-4o for text classification
   - GPT-4o Vision for images

3. **Backend → Database**
   - SQLAlchemy ORM
   - Session dependency injection
   - Automatic schema creation

4. **Frontend → Map**
   - Leaflet integration
   - OpenStreetMap tiles
   - Color-coded markers

5. **Frontend → Polling**
   - 5-second interval
   - useEffect + setInterval
   - Auto-cleanup on unmount

## Next Steps

1. **Setup** - Run `setup.sh` or `setup.bat`
2. **Configure** - Add `OPENAI_API_KEY` to `backend/.env`
3. **Run** - Start backend and frontend
4. **Test** - Try all features locally
5. **Deploy** - Follow `DEPLOYMENT.md`

---

**Total Files:** 30+
**Total Lines of Code:** ~4,000+
**Configuration Files:** 10+
**Documentation Files:** 4+
**Status:** ✅ Production Ready
