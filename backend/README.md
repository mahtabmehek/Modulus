# Modulus LMS Backend API

A Node.js/Express backend API for the Modulus Learning Management System.

## Features

- **Health Monitoring**: `/health` and `/health/db` endpoints
- **API Endpoints**: RESTful API for users and labs
- **Database Integration**: PostgreSQL with connection pooling
- **Security**: Helmet.js for security headers, CORS support
- **Docker Ready**: Containerized for ECS deployment

## Endpoints

- `GET /health` - Application health check
- `GET /health/db` - Database connectivity check
- `GET /api/status` - API status and version
- `GET /api/users` - Users management (placeholder)
- `GET /api/labs` - Labs management (placeholder)

## Environment Variables

- `NODE_ENV` - Application environment (production/development)
- `PORT` - Server port (default: 3001)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password (from AWS Secrets Manager)

## Database

PostgreSQL 15.7 running on AWS RDS with:
- **Instance**: db.t3.micro (Free Tier)
- **Storage**: 20GB GP2 with encryption
- **Backup**: 7-day retention
- **Security**: VPC isolated, backend-only access

## Deployment

Automatically deployed via GitHub Actions when changes are pushed to:
- `backend/` directory
- `backend-deployment.sh`
- `.github/workflows/backend-deployment.yml`
