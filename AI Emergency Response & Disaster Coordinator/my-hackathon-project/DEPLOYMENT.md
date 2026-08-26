# Deployment Guide

## Overview

This guide covers deploying the Emergency Response Coordinator to production environments.

## Prerequisites

- Docker (optional but recommended)
- Server with Python 3.10+ and Node.js 18+
- PostgreSQL database (recommended for production)
- OpenAI API key

## Backend Deployment

### Option 1: Traditional Server Deployment

#### 1. Setup Server

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install python3.10 python3.10-venv python3-pip

# Clone repository
git clone <repository-url>
cd my-hackathon-project/backend

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

#### 2. Configure Environment

```bash
cp .env.example .env

# Edit .env with production settings:
# - DATABASE_URL=postgresql://user:pass@db-host:5432/emergency_db
# - OPENAI_API_KEY=sk-...
# - CORS_ORIGINS=["https://yourdomain.com"]
```

#### 3. Initialize Database

```bash
python seed.py
```

#### 4. Run with Gunicorn

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

#### 5. Setup Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /path/to/backend/uploads;
        expires 30d;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/key.key;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile (backend)

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

#### 2. Create .dockerignore

```
venv
__pycache__
.env
*.db
uploads
.git
.gitignore
```

#### 3. Build and Run

```bash
docker build -t emergency-api .
docker run -d \
  --name emergency-api \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e OPENAI_API_KEY=sk-... \
  -v uploads:/app/uploads \
  emergency-api
```

### Option 3: Platform Deployments

#### Heroku

```bash
# 1. Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Create app
heroku create your-app-name

# 4. Set environment variables
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set DATABASE_URL=postgresql://...

# 5. Create Procfile
echo "web: gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker" > Procfile

# 6. Deploy
git push heroku main
```

#### Railway

```bash
# 1. Create account at railway.app
# 2. Connect GitHub repository
# 3. Set environment variables in Railway dashboard
# 4. Deploy automatically from git
```

#### AWS Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init -p python-3.10 emergency-api

# 3. Create environment
eb create prod

# 4. Set environment variables
eb setenv OPENAI_API_KEY=sk-...

# 5. Deploy
eb deploy
```

## Frontend Deployment

### Option 1: Static Hosting (Recommended)

#### 1. Build

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with static files.

#### 2. Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard
VITE_API_URL=https://api.yourdomain.com
```

#### 3. Deploy to Netlify

```bash
# 1. Install Netlify CLI
npm i -g netlify-cli

# 2. Deploy
netlify deploy --prod --dir dist

# 3. Set environment variables in Netlify dashboard
VITE_API_URL=https://api.yourdomain.com
```

#### 4. Deploy to S3 + CloudFront

```bash
# Build
npm run build

# Install AWS CLI
pip install awscli

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"
```

#### 5. Deploy to GitHub Pages

```bash
# Edit vite.config.js
export default {
  base: '/emergency-response-coordinator/',
  ...
}

# Build
npm run build

# Deploy
npm run deploy
```

### Option 2: Traditional Web Server

#### Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/emergency-coordinator;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/emergency-coordinator

    <Directory /var/www/emergency-coordinator>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</VirtualHost>
```

## Database Setup

### PostgreSQL

```sql
-- Create database
CREATE DATABASE emergency_db;

-- Create user
CREATE USER emergency_user WITH PASSWORD 'strong_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE emergency_db TO emergency_user;
```

Connection string:
```
postgresql://emergency_user:strong_password@db-host:5432/emergency_db
```

### Database Migration

```bash
# In backend
# 1. Update DATABASE_URL in .env
# 2. Run initialization
python -c "from database import init_db; init_db()"

# 3. Seed data
python seed.py
```

## Security Checklist

- [ ] Use HTTPS with valid SSL/TLS certificate
- [ ] Set strong OPENAI_API_KEY value
- [ ] Use strong database passwords
- [ ] Enable CORS only for your frontend domain
- [ ] Use environment variables for all secrets
- [ ] Enable database backups
- [ ] Setup monitoring and alerting
- [ ] Use rate limiting on API endpoints
- [ ] Enable CSRF protection
- [ ] Implement input validation
- [ ] Use firewall rules to restrict access
- [ ] Setup logs aggregation

## Monitoring & Logging

### Application Logging

```python
# In app/main.py
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

### Prometheus Metrics

```bash
pip install prometheus-client
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

```bash
docker-compose up -d  # With ELK docker-compose.yml
```

### Application Performance Monitoring (APM)

```bash
# New Relic
pip install newrelic
NEW_RELIC_CONFIG_FILE=newrelic.ini newrelic-admin run-program gunicorn app.main:app

# Datadog
pip install datadog
# Configure in app/main.py
```

## Backup Strategy

### Database Backups

```bash
# PostgreSQL
pg_dump emergency_db > backup.sql

# Automated daily backup
0 2 * * * pg_dump emergency_db | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

### File Backups

```bash
# Backup uploads folder
tar -czf uploads_backup.tar.gz uploads/

# S3 backup
aws s3 sync uploads/ s3://backup-bucket/uploads/
```

## Performance Optimization

### Frontend

```bash
# Analyze bundle size
npm run build -- --analyze

# Enable gzip compression in nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
```

### Backend

```python
# Enable query optimization
SQLALCHEMY_ECHO=false  # Disable in production

# Use connection pooling
pool_size = 20
max_overflow = 40

# Enable caching
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_operation():
    ...
```

### Database

```sql
-- Create indexes for common queries
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
```

## Rollback Strategy

```bash
# Keep previous versions
tag-version=v1.2.0
docker tag emergency-api:latest emergency-api:v1.2.0
docker push emergency-api:v1.2.0

# Rollback
docker run emergency-api:v1.1.9
```

## Support

- Check logs: `docker logs container-name`
- Check status: `curl http://localhost:8000/api/health`
- View API docs: `http://api.yourdomain.com/docs`
- Contact support team for assistance
