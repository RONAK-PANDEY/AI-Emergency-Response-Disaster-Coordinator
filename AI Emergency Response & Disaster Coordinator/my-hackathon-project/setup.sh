#!/bin/bash
# Setup script for Emergency Response Coordinator

set -e

echo "🚀 Setting up Emergency Response & Disaster Coordinator..."

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python -m venv venv
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
pip install -r requirements.txt

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Created .env file - please update OPENAI_API_KEY"
fi

# Initialize database
echo "🗄️  Initializing database..."
python seed.py

cd ..

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd frontend

# Install dependencies
npm install

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update backend/.env with your OPENAI_API_KEY"
echo "2. Start backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "3. Start frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "📚 Backend API Docs: http://localhost:8000/docs"
