# Project Architecture & Integration Guide

## Overview

This document explains how all components of the Emergency Response Coordinator are connected and integrated.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                     (React + TypeScript)                          │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard | Live Map | Report Form | Stats Bar                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                      (HTTP REST API)
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│                   (app/main.py - Port 8000)                      │
├─────────────────────────────────────────────────────────────────┤
│  API Routes (app/api/incidents.py)                               │
│  ├─ POST /api/report (Create incident)                           │
│  ├─ GET /api/incidents (List incidents)                          │
│  ├─ GET /api/incidents/{id} (Get incident)                       │
│  └─ PATCH /api/incidents/{id} (Update status)                    │
└─────────────────────────────────────────────────────────────────┘
          ↕                              ↕
      Database               AI Services
   (SQLAlchemy)           (OpenAI GPT-4o)
       ↓                        ↓
   ┌──────────────┐      ┌──────────────┐
   │ SQLite/      │      │ Text Class.  │
   │ PostgreSQL   │      │ Image Anal.  │
   │ incidents.db │      │              │
   └──────────────┘      └──────────────┘
```

## Component Breakdown

### Frontend (React + TypeScript + Tailwind)

**Location:** `frontend/src/`

#### Components

1. **Dashboard.tsx** (pages/)
   - Main container component
   - Navigation between views (map, dashboard, report)
   - Fetches incidents from API
   - Passes data to child components

2. **EmergencyMap.tsx** (components/)
   - Leaflet map visualization
   - Displays incidents as color-coded markers
   - Real-time polling (5s interval)
   - Click marker to see popup details

3. **AdminDashboard.tsx** (components/)
   - Table view of all incidents
   - Sort by severity, time, or type
   - Filter by status/severity
   - Click "Details" to see incident details modal

4. **ReportForm.tsx** (components/)
   - Form to submit new incident
   - GPS location sharing
   - Optional image upload
   - Calls POST /api/report
   - Shows success/error messages

5. **StatsBar.tsx** (components/)
   - Displays count of active incidents
   - Breaks down by severity level
   - Updates in real-time

#### Data Flow

```
User Input
   ↓
ReportForm component
   ↓
POST /api/report
   ↓
Backend processes & classifies
   ↓
Response with incident details
   ↓
Update React state
   ↓
All components re-render with new data
   ↓
Dashboard, Map, and Stats Bar update
```

### Backend (FastAPI + SQLAlchemy)

**Location:** `backend/`

#### File Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app initialization
│   ├── models/
│   │   └── incident.py         # SQLAlchemy models (Incident, Report)
│   ├── schemas/
│   │   └── incident.py         # Pydantic validation schemas
│   ├── services/
│   │   ├── __init__.py         # AI classification service
│   │   └── image_analyzer.py   # Vision analysis service
│   ├── api/
│   │   ├── __init__.py
│   │   └── incidents.py        # API route handlers
│   └── core/
│       ├── config.py           # Settings from environment
│       └── __init__.py
├── database.py                 # SQLAlchemy setup & session
├── seed.py                     # Data seeding script
└── requirements.txt            # Python dependencies
```

#### Request/Response Flow

```
HTTP Request from Frontend
   ↓
FastAPI Router (incidents.py)
   ↓
Dependency Injection (get_db)
   ↓
Route Handler Function
   ├─ Validate Input (Pydantic)
   ├─ Classify Text (AI Service)
   ├─ Analyze Image (if provided)
   ├─ Database Operations (SQLAlchemy)
   └─ Build Response
   ↓
HTTP Response (JSON)
   ↓
Frontend receives & updates state
```

#### Database Schema

**Incidents Table:**
```sql
CREATE TABLE incidents (
  id INTEGER PRIMARY KEY,
  type VARCHAR NOT NULL,           -- fire, flood, accident, medical, etc.
  severity VARCHAR NOT NULL,       -- critical, high, medium, low
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  description TEXT NOT NULL,
  people_affected INTEGER,
  status VARCHAR NOT NULL,         -- new, reported, investigating, etc.
  created_at DATETIME DEFAULT NOW
);
```

**Reports Table:**
```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY,
  incident_id INTEGER FOREIGN KEY,
  description TEXT NOT NULL,
  image_path VARCHAR,
  created_at DATETIME DEFAULT NOW
);
```

### AI Services Integration

#### Text Classification (app/services/__init__.py)

**Function:** `classify_emergency(text: str) -> dict`

**Process:**
1. Takes raw emergency report text
2. Sends to OpenAI GPT-4o via API
3. Uses JSON mode for structured response
4. Returns classification with:
   - type (fire, flood, accident, medical, other)
   - severity (critical, high, medium, low)
   - people_affected (count or null)
   - required_team (fire_rescue, medical, police)
   - confidence (0-1 float)

**Integration:**
```python
# In incidents.py POST /api/report endpoint:
classification = classify_emergency(payload.description)
incident.type = map_ai_type_to_incident_type(classification.get("type"))
incident.severity = map_ai_severity_to_incident_severity(classification.get("severity"))
incident.people_affected = classification.get("people_affected")
```

**Fallback Behavior:**
- If API fails: Returns safe defaults (type=other, severity=medium, confidence=0)
- Includes error message in response
- Doesn't block incident creation

#### Image Analysis (app/services/image_analyzer.py)

**Function:** `analyze_emergency_image(image_path: str) -> dict`

**Process:**
1. Reads image from disk
2. Encodes to base64
3. Sends to OpenAI GPT-4o Vision API
4. Returns analysis with:
   - visible_severity (critical, high, medium, low)
   - hazards_visible (list of detected hazards)
   - confidence (0-1 float)

**Integration:**
```python
# In incidents.py POST /api/report endpoint:
if image:
    image_analysis = analyze_emergency_image(image_path)
    # If image severity > text severity, upgrade
    if image_severity_order > current_severity_order:
        incident.severity = higher_severity
```

## Data Flow Examples

### Example 1: User Reports Emergency with Text

```
1. User fills ReportForm
   - Description: "Fire in warehouse"
   - Location: 30.901, 75.857
   - No image

2. Frontend POST /api/report
   {
     "description": "Fire in warehouse",
     "latitude": 30.901,
     "longitude": 75.857
   }

3. Backend processes:
   a. Creates Incident (type=OTHER, severity=UNCLASSIFIED)
   b. Saves to database
   c. Calls classify_emergency("Fire in warehouse")
   d. AI returns: {type: "fire", severity: "high", confidence: 0.95, ...}
   e. Updates incident: type=FIRE, severity=HIGH
   f. Saves to database

4. Returns IncidentOut response
   {
     "id": 42,
     "type": "fire",
     "severity": "high",
     "latitude": 30.901,
     "longitude": 75.857,
     "description": "Fire in warehouse",
     "people_affected": 0,
     "status": "new",
     "created_at": "2024-01-15T10:30:00"
   }

5. Frontend receives response
   - Updates React state
   - Dashboard re-renders with new incident
   - Map updates with new marker
   - Stats bar increments "high" count
```

### Example 2: User Reports with Image

```
1. User submits:
   - Description: "Building with smoke"
   - Location: 31.62, 74.87
   - Image: photo.jpg

2. Backend processes:
   a. Saves image to: uploads/incident_42_photo.jpg
   b. Classifies text → type=OTHER, severity=MEDIUM
   c. Analyzes image via Vision API → visible_severity=HIGH
   d. Compares: HIGH > MEDIUM, so upgrades
   e. Final: type=OTHER, severity=HIGH

3. Incident stored with both classifications:
   - Text confidence: 0.7
   - Image confidence: 0.9
```

### Example 3: Fetching List of Incidents

```
1. Frontend mounts Dashboard
   → useEffect calls GET /api/incidents

2. Backend query:
   SELECT * FROM incidents 
   ORDER BY created_at DESC
   LIMIT 100

3. Returns JSON array of incidents

4. Frontend stores in state
   - Map component renders markers
   - Dashboard renders table rows
   - Stats bar counts by severity

5. Frontend sets interval:
   - Every 5 seconds: fetch /api/incidents again
   - Compare with stored data
   - Re-render only if changed
```

### Example 4: Updating Incident Status

```
1. Admin clicks "Dispatch" button in detail modal

2. Frontend PATCH /api/incidents/42
   {
     "status": "in_progress"
   }

3. Backend:
   a. Finds incident ID 42
   b. Validates status value
   c. Updates: status=IN_PROGRESS
   d. Saves to database
   e. Returns updated incident

4. Frontend refreshes incident list (5s poll)
   - Dashboard table status updates
   - Map colors might change (based on status)
```

## Configuration & Environment Variables

### Backend (.env)

```
DATABASE_URL=sqlite:///./incidents.db     # SQLite for dev
DATABASE_URL=postgresql://...             # PostgreSQL for prod
OPENAI_API_KEY=sk-...                     # Required for AI
UPLOAD_DIR=./uploads                      # Image upload location
SQLALCHEMY_ECHO=false                     # SQL query logging
CORS_ORIGINS=["http://localhost:5173"]    # Frontend URL
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000        # Backend URL
```

## Authentication & Security

**Current State:** No authentication (for hackathon)

**For Production:**
- Add JWT authentication
- Hash user passwords
- Validate all inputs server-side
- Rate limit API endpoints
- Use HTTPS only
- Store API keys securely

## Performance Considerations

### Frontend
- React memo for expensive components
- useCallback for event handlers
- Lazy loading routes
- Image optimization
- CSS caching

### Backend
- Database indexes on severity, status, created_at
- Query optimization (pagination)
- Connection pooling
- Response caching where appropriate
- Gzip compression

### AI Services
- Cache classifications for same text
- Async image processing
- Timeout handling
- Fallback responses

## Error Handling

### Frontend
```javascript
// Show error toast/banner if API fails
const [error, setError] = useState<string | null>(null)
try {
  const response = await fetch(...)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
} catch (err) {
  setError(err.message)
  // Display to user
}
```

### Backend
```python
# Return appropriate HTTP status codes
if not incident:
  raise HTTPException(status_code=404, detail="Incident not found")

# Validation errors
raise HTTPException(status_code=400, detail="Invalid input")

# Server errors
try:
  classification = classify_emergency(text)
except Exception as e:
  logger.error(f"Classification failed: {e}")
  # Still create incident with defaults
  return incident
```

## Testing

### Frontend Tests
```bash
npm test                          # Run Jest tests
npm run build                     # Build for production
```

### Backend Tests
```bash
pip install pytest
pytest                            # Run tests
pytest -v                         # Verbose
pytest --cov                      # Coverage report
```

## Deployment Integration

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Docker containerization
- Cloud platform deployment (Heroku, Railway, AWS)
- Database setup (PostgreSQL)
- Environment configuration
- Monitoring and logging

## Common Customizations

### Add New Incident Type
1. Add to `IncidentType` enum in `app/models/incident.py`
2. Update AI prompt in `app/services/__init__.py`
3. Add icon in `EmergencyMap.tsx`

### Add New API Endpoint
1. Create handler in `app/api/incidents.py`
2. Add route decorator: `@router.get("/api/endpoint")`
3. Call frontend: `fetch("http://localhost:8000/api/endpoint")`

### Change Polling Interval
1. Frontend: Edit interval in Dashboard.tsx useEffect (default: 5000ms)
2. Backend: No change needed (stateless)

### Add Authentication
1. Generate JWT in backend after login
2. Store token in frontend localStorage
3. Include in Authorization header
4. Validate on each request

## Support & Debugging

### Check Backend
```bash
curl http://localhost:8000/api/health     # Status
curl http://localhost:8000/docs           # API docs
tail -f backend.log                        # Logs
```

### Check Frontend
```bash
Open DevTools (F12)
Console tab → Check for errors
Network tab → Check API calls
```

### Database Issues
```bash
sqlite3 incidents.db ".schema"             # View schema
sqlite3 incidents.db "SELECT * FROM incidents LIMIT 10;"  # View data
python backend/seed.py                    # Reseed
```
