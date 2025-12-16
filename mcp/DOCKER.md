# MCP Docker Setup

## Prerequisites

- Docker and Docker Compose installed
- `.env` file with `GEMINI_API_KEY` set

## Quick Start

### 1. Set Environment Variables

```bash
# On Linux/Mac
export GEMINI_API_KEY="your_api_key_here"

# Or create a .env file with:
GEMINI_API_KEY=your_api_key_here
```

### 2. Start Services

```bash
# Build and start both MongoDB and MCP server
docker-compose up -d

# View logs
docker-compose logs -f

# View MCP server logs only
docker-compose logs -f mcp-server

# View MongoDB logs only
docker-compose logs -f mongodb
```

### 3. Verify Services

```bash
# Check server health
curl http://localhost:8080/health

# Should respond with:
# {"status":"ok","timestamp":"2025-12-16T..."}
```

### 4. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

## Environment Variables

The following variables are used in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | MCP server port |
| `NODE_ENV` | development | Node environment |
| `BACKEND_PORT` | 8000 | Backend API port |
| `BACKEND_URL` | http://backend | Backend API URL |
| `GEMINI_API_KEY` | - | Google Gemini API key (required) |
| `MODEL` | gemini-2.5-flash | AI model name |
| `MONGODB_URI` | mongodb://... | MongoDB connection string |

## Database

MongoDB is configured with:
- **Username**: root
- **Password**: password
- **Database**: notesapp
- **Port**: 27017

Data is persisted in volumes:
- `mongodb_data` - Database files
- `mongodb_config` - Configuration files

## Volumes

The MCP server has source code mounted:
- Host: `./src` → Container: `/app/src`

This allows hot-reloading during development. Remove this for production.

## Networking

Services communicate over the `notesapp-network` bridge network:
- MCP connects to MongoDB at: `mongodb:27017`
- MCP exposes health check at: `http://localhost:8080/health`

## Health Checks

Both services have health checks:

### MongoDB
- Command: `mongosh ping`
- Interval: 10s
- Timeout: 5s
- Retries: 5

### MCP Server
- Endpoint: `GET /health`
- Interval: 30s
- Timeout: 10s
- Retries: 3
- Start period: 40s (time to wait before first check)

## Production Deployment

For production, consider:
1. Remove source code volume mount
2. Set `NODE_ENV=production`
3. Use strong MongoDB credentials
4. Store secrets in `.env` or environment
5. Add reverse proxy (Nginx/Caddy)
6. Enable MongoDB authentication in separate compose file
7. Use named volumes for data persistence

## Troubleshooting

### MongoDB won't connect

```bash
# Check if MongoDB is running
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### MCP server crashes

```bash
# View full logs
docker-compose logs mcp-server

# Rebuild and restart
docker-compose up --build mcp-server
```

### Permission denied on volumes

```bash
# Fix volume ownership
docker-compose down
sudo chown -R $USER:$USER mongodb_data
docker-compose up -d
```
