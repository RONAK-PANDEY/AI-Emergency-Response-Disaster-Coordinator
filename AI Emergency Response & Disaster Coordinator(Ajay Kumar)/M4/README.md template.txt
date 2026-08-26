# Project Name

One-line description of what this hackathon project does.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** FastAPI (Python)
- **Database:** (e.g. SQLite / PostgreSQL / Supabase — fill in)

## Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn/pnpm

## Getting Started

### 1. Clone the repo

\`\`\`bash
git clone https://github.com/your-org/your-repo.git
cd your-repo
\`\`\`

### 2. Backend setup (FastAPI)

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env          # fill in your values
uvicorn app.main:app --reload --port 8000
\`\`\`

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 3. Frontend setup (Vite React)

\`\`\`bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:8000
npm run dev
\`\`\`

Frontend runs at `http://localhost:5173`

## Environment Variables

**backend/.env**
\`\`\`
DATABASE_URL=
SECRET_KEY=
CORS_ORIGINS=http://localhost:5173
\`\`\`

**frontend/.env**
\`\`\`
VITE_API_URL=http://localhost:8000
\`\`\`

## Project Structure

\`\`\`
frontend/   # React UI (Vite)
backend/    # FastAPI server + API routes
\`\`\`

## Team

- Name — role
- Name — role

## License

MIT (or leave blank for hackathon)