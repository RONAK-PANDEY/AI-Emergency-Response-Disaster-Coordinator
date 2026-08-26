FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# copy only requirements first to leverage docker cache
COPY backend/requirements.txt ./requirements.txt

# Install minimal system build deps then Python deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc build-essential curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN python -m pip install --upgrade pip setuptools wheel
RUN python -m pip install -r requirements.txt

# Copy application code
COPY backend/ /app/

# Use a writable path for sqlite DB
ENV DATABASE_URL=sqlite:////app/incidents.db
ENV FRONTEND_URL=http://localhost:5173

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
