# AI Emergency Response & Disaster Coordinator

A real-time emergency response and disaster coordination system powered by AI.

## Features

- 🗺️ **Live Map**: Real-time visualization of emergency incidents on an interactive map
- 📊 **Admin Dashboard**: Comprehensive dashboard for monitoring and managing incidents
- 🤖 **AI Classification**: Automatic classification of emergencies using GPT-4o
- 📸 **Image Analysis**: Vision-based hazard detection from emergency photos
- 📍 **GPS Reporting**: Citizens can report incidents with GPS location
- 🚀 **Real-time Updates**: Live polling of incident data

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite + Leaflet
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **AI**: OpenAI GPT-4o (text classification + vision)
- **Map**: Leaflet + OpenStreetMap

## Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn
- OpenAI API key

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/emergency-response-coordinator.git
cd emergency-response-coordinator
```

### 2. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env and add your OPENAI_API_KEY
# OPENAI_API_KEY=sk-...

# Initialize database and seed with sample data
python seed.py

# Run the server
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`
API docs available at `http://localhost:8000/docs`

### 3. Frontend Setup (Vite React)

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run development server
npm run dev
```

Frontend runs at `http://localhost:5173`

## Project Structure

```
my-hackathon-project/
├── .gitignore
├── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ReportForm.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   └── EmergencyMap.tsx
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── .env.example
│   └── .gitignore
└── backend/
    ├── app/
    │   ├── __init__.py
    │   ├── main.py
    │   ├── models/
    │   │   └── incident.py
    │   ├── schemas/
    │   │   └── incident.py
    │   ├── services/
    │   │   ├── __init__.py
    │   │   └── image_analyzer.py
    │   ├── api/
    │   │   ├── __init__.py
    │   │   ├── incidents.py
    │   │   └── routes/
    │   │       └── __init__.py
    │   └── core/
    │       ├── __init__.py
    │       └── config.py
    ├── database.py
    ├── seed.py
    ├── requirements.txt
    ├── .env.example
    └── .gitignore
```

## API Endpoints

### Health Check
- `GET /api/health` - Health check
- `GET /api/ping` - Ping

### Incidents
- `POST /api/report` - Submit new incident report
- `GET /api/incidents` - Get all incidents (with filtering)
- `GET /api/incidents/{id}` - Get specific incident
- `PATCH /api/incidents/{id}` - Update incident status

## Usage

### Reporting an Incident

1. Navigate to the **Report** tab
2. Describe the emergency
3. Share your GPS location
4. Optionally upload an incident photo
5. Submit the report

The system will:
- Automatically classify the incident type and severity using AI
- Analyze the photo for visible hazards (if provided)
- Store the incident in the database
- Display it on the live map
- Update the admin dashboard

### Monitoring Incidents

- **Live Map**: View all active incidents on an interactive map with color-coded severity
- **Dashboard**: Detailed table view with sorting and filtering capabilities
- **Stats Bar**: Real-time count of active incidents by severity level

## AI Features

### Text Classification
Uses GPT-4o to classify emergency reports into:
- **Type**: fire, flood, accident, medical, natural_disaster, infrastructure, public_health, security, other
- **Severity**: critical, high, medium, low
- **Teams Needed**: fire_rescue, medical, police
- **People Affected**: estimated count
- **Confidence**: 0-1 score

### Image Analysis
Uses GPT-4o Vision to:
- Detect visible hazards in photos
- Assess visible severity level
- Provide confidence score for assessment

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
pip install gunicorn
gunicorn app.main:app

# Frontend
cd frontend
npm run build
npm run preview
```

## Database

The system uses SQLite by default. To switch to PostgreSQL:

```bash
# In backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/emergency_db

# Install PostgreSQL driver
pip install psycopg2-binary
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./incidents.db
OPENAI_API_KEY=your_key_here
UPLOAD_DIR=./uploads
SQLALCHEMY_ECHO=false
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### CORS Errors
- Ensure backend is running on http://localhost:8000
- Check CORS_ORIGINS in backend/app/core/config.py

### OpenAI API Errors
- Verify OPENAI_API_KEY is set correctly in .env
- Check your OpenAI account has available credits
- Ensure you're using a valid model (gpt-4o)

### Database Issues
- Delete `incidents.db` to reset database
- Run `python seed.py` to populate sample data

### Frontend Connection Issues
- Check if backend is running: `curl http://localhost:8000/api/health`
- Verify VITE_API_URL in frontend/.env
- Clear browser cache and reload

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

## Acknowledgments

- OpenAI for GPT-4o and Vision API
- Leaflet for map visualization
- FastAPI for the backend framework
- React and Vite for the frontend
- Tailwind CSS for styling
