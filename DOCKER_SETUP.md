# PentaNotes Docker Architecture

## Overview

This project uses a **modular Docker setup** with two approaches:

### Option 1: Run Everything from Root (Recommended)
Start all services (Backend + MCP) from the project root.

### Option 2: Run Services Independently
Start individual services from their own folders.

---

## Option 1: Complete Stack (from root)

### Start All Services
```bash
cd c:\Personal\NotesApp

# Build and start everything
docker-compose up -d

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f mcp-server
```

### Verify All Services
```bash
# Check status
docker-compose ps

# Test Backend
curl http://localhost:8000/api/auth/health

# Test MCP
curl http://localhost:8080/health
```

### Stop Everything
```bash
docker-compose down

# Or with data removal
docker-compose down -v
```

---

## Option 2: Independent Services

### Start Backend Only
```bash
cd c:\Personal\NotesApp\backend

docker-compose up -d
docker-compose logs -f
curl http://localhost:8000/api/auth/health
```

### Start MCP Only
```bash
cd c:\Personal\NotesApp\mcp

# First ensure Backend is running (see above)
docker-compose up -d
docker-compose logs -f
curl http://localhost:8080/health
```

### Stop Individual Services
```bash
# From backend folder
cd backend && docker-compose down

# From mcp folder
cd mcp && docker-compose down
```

---

## Architecture

```
PentaNotes/
├── docker-compose.yml          # Root orchestrator (all services)
├── backend/
│   ├── docker-compose.yml      # Backend + PostgreSQL only
│   └── Dockerfile
├── mcp/
│   ├── docker-compose.yml      # MCP + MongoDB only
│   └── Dockerfile
└── frontend/                   # React (runs locally or separately)
    └── pentanotes-frontend/
```

### Network Topology

When running from root:
```
┌─────────────────────────────────────────┐
│       notesapp-network (bridge)         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐   ┌──────────────┐   │
│  │  PostgreSQL  │   │   MongoDB    │   │
│  │   :5432      │   │   :27017     │   │
│  └──────────────┘   └──────────────┘   │
│         ▲                  ▲             │
│         │                  │             │
│  ┌──────────────┐   ┌──────────────┐   │
│  │   Backend    │   │  MCP Server  │   │
│  │   :8000      │◄──│   :8080      │   │
│  └──────────────┘   └──────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Environment Variables

### From Root (all services)
Create `.env` in root folder:
```
GEMINI_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here
```

### Individual Services
Each folder has its own `.env`:
- `backend/.env` - Backend config
- `mcp/.env` - MCP config

---

## Commands Comparison

| Task | From Root | From Individual |
|------|-----------|-----------------|
| Start all | `docker-compose up -d` | Run from each folder separately |
| Start one | `docker-compose up -d backend` | `cd backend && docker-compose up -d` |
| View logs | `docker-compose logs -f` | `docker-compose logs -f` |
| Stop all | `docker-compose down` | Run in each folder |
| Rebuild | `docker-compose up --build -d` | `cd backend && docker-compose up --build -d` |

---

## Common Workflows

### Development: Everything at Once
```bash
cd c:\Personal\NotesApp
docker-compose up -d
docker-compose logs -f
```

### Development: Backend Only
```bash
cd c:\Personal\NotesApp\backend
docker-compose up -d
npm run dev  # Or let Docker run it
```

### After Code Changes
```bash
cd c:\Personal\NotesApp

# If using root docker-compose
docker-compose up --build -d

# Or specific service
docker-compose up --build -d backend
```

### Debug Specific Service
```bash
# Check status
docker-compose ps

# View logs with timestamps
docker-compose logs --timestamps -f backend

# Access running container
docker exec -it notesapp-backend bash

# For PostgreSQL
docker exec -it notesapp-postgres psql -U postgres -d notesdb
```

### Reset Everything
```bash
# Stop and remove all data
docker-compose down -v

# Rebuild everything
docker-compose up --build -d
```

---

## Recommendations

### ✅ Use Root docker-compose When:
- Developing the entire application
- All services need to run together
- Testing API integration
- Deploying to production

### ✅ Use Individual docker-compose When:
- Developing only Backend or MCP
- Troubleshooting one service
- Running Backend on production, MCP locally
- Running MCP on different machine than Backend

---

## Health Checks

All services have health checks:

| Service | Endpoint | Port |
|---------|----------|------|
| Backend | `/api/auth/health` | 8000 |
| MCP | `/health` | 8080 |
| PostgreSQL | `pg_isready` | 5432 |
| MongoDB | `mongosh ping` | 27017 |

```bash
# Check all
docker-compose ps

# Manual test
curl http://localhost:8000/api/auth/health
curl http://localhost:8080/health
```

---

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Ensure no port conflicts
lsof -i :8000
lsof -i :8080
lsof -i :5432
lsof -i :27017
```

### Backend can't connect to MCP or vice versa
```bash
# They're on same network, use service name:
# Backend to MCP: http://mcp-server:8080
# MCP to Backend: http://backend:8000
```

### Database connection failed
```bash
# Check PostgreSQL is healthy
docker-compose ps

# Test connection
docker exec -it notesapp-postgres pg_isready
```

---

## Production Deployment

For production:

1. **Use root docker-compose** but remove volume mounts
2. **Store secrets** in environment, not .env
3. **Use managed databases** (RDS, Atlas) instead of Docker
4. **Use Docker registry** (ECR, Docker Hub) for images
5. **Add monitoring** and logging services

Example production compose:
```yaml
# Remove volume mounts
# volumes:
#   - ./backend/src:/app/src

# Use environment variables from CI/CD
environment:
  - JWT_SECRET=${JWT_SECRET}
  - GEMINI_API_KEY=${GEMINI_API_KEY}

# Or connect to managed services
DB_HOST: prod-database.rds.amazonaws.com
MONGODB_URI: mongodb+srv://user:pass@atlas.mongodb.net/...
```

---

## Next Steps

1. **From Root**: `docker-compose up -d`
2. **Test**: `curl http://localhost:8000/api/auth/health`
3. **View Logs**: `docker-compose logs -f`
4. **Stop**: `docker-compose down`
