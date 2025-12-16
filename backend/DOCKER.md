# Backend Docker Setup

## Prerequisites

- Docker and Docker Compose installed
- `.env` file with `JWT_SECRET` set (optional, has default)

## Quick Start

### 1. Start Services

```bash
# Build and start both PostgreSQL and Backend
docker-compose up -d

# View logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View PostgreSQL logs only
docker-compose logs -f postgres
```

### 2. Verify Services

```bash
# Check backend health
curl http://localhost:8000/api/auth/health

# Should respond with:
# {"status":"ok"}
```

### 3. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

## Environment Variables

### PostgreSQL
| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | postgres | Database user |
| `POSTGRES_PASSWORD` | postgres | Database password |
| `POSTGRES_DB` | notesdb | Database name |

### Backend
| Variable | Default | Description |
| `PORT` | 8000 | Backend server port |
| `NODE_ENV` | development | Node environment |
| `DB_HOST` | postgres | Database host (Docker service name) |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | notesdb | Database name |
| `DB_USERNAME` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `JWT_SECRET` | (see .env) | JWT signing secret |
| `JWT_EXPIRES_IN` | 1h | JWT expiration time |

## Database

PostgreSQL is configured with:
- **Username**: postgres
- **Password**: postgres
- **Database**: notesdb
- **Port**: 5432

Data is persisted in `postgres_data` volume.

## Common Commands

### Rebuild and Restart
```bash
# After code changes
docker-compose down
docker-compose up --build -d
docker-compose logs -f backend
```

### Quick Restart
```bash
# Without rebuild
docker-compose restart backend
```

### Database Operations

```bash
# Connect to PostgreSQL CLI
docker exec -it notesapp-postgres psql -U postgres -d notesdb

# Common SQL commands inside container:
\dt              # List tables
\l               # List databases
SELECT * FROM "Users";  # Query users
```

### Reset Database

```bash
# Delete all data but keep running containers
docker-compose exec postgres psql -U postgres -d notesdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Or delete everything and start fresh
docker-compose down -v
docker-compose up -d
```

### View Running Processes

```bash
# List all containers
docker-compose ps

# Check resource usage
docker stats

# View logs with timestamps
docker-compose logs --timestamps -f
```

## Networking

Services communicate over the `notesapp-network` bridge network:
- Backend connects to PostgreSQL at: `postgres:5432`
- Backend exposes API at: `http://localhost:8000`

## Health Checks

Both services have health checks:

### PostgreSQL
- Command: `pg_isready -U postgres`
- Interval: 10s
- Timeout: 5s
- Retries: 5

### Backend
- Endpoint: `GET /api/auth/health`
- Interval: 30s
- Timeout: 10s
- Retries: 3
- Start period: 40s

## Volumes

- `postgres_data` - PostgreSQL database files (persisted between restarts)
- `./src` - Source code (mounted for development, hot-reload)

Remove source code volume mount for production deployments.

## Production Deployment

For production, consider:

1. **Security**:
   - Use strong PostgreSQL credentials
   - Store secrets in environment or .env files (not in repo)
   - Use strong JWT_SECRET

2. **Configuration**:
   - Set `NODE_ENV=production`
   - Disable logging of sensitive data
   - Enable HTTPS/TLS

3. **Database**:
   - Use managed PostgreSQL service (AWS RDS, Azure Database, etc.)
   - Regular backups
   - Connection pooling

4. **Deployment**:
   - Use Docker registry (Docker Hub, ECR, etc.)
   - Remove source code volume mount
   - Use separate docker-compose files for prod/dev

5. **Monitoring**:
   - Add application monitoring
   - Log aggregation
   - Performance monitoring

## Troubleshooting

### Backend won't connect to database

```bash
# Check PostgreSQL is running and healthy
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec backend psql -h postgres -U postgres -d notesdb -c "SELECT 1"
```

### "Port 8000 already in use"

```bash
# Find process using port
lsof -i :8000

# Or use a different port in docker-compose.yml
# Change "8000:8000" to "8001:8000"
```

### "Permission denied" errors

```bash
# Fix volume permissions
docker-compose down
sudo chown -R $USER:$USER postgres_data
docker-compose up -d
```

### Database connection timeout

```bash
# Ensure PostgreSQL is fully started before backend
docker-compose up postgres -d
sleep 5
docker-compose up backend -d

# Or check health status
docker-compose ps
```

## API Endpoints

```bash
# Health check
curl http://localhost:8000/api/auth/health

# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get profile (requires token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/auth/profile
```
