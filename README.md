# PentaNotes - AI-Powered Notes Management

A full-stack note-taking app with an intelligent AI assistant (powered by Google Gemini) that can create, organize, and manage notes using natural language commands.

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/pentakor/PentaNotes.git
cd PentaNotes
```

### 2. Configure Environment
Create `.env` files:

**backend/.env:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notesdb
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Application configuration
PORT=8000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_secret
JWT_EXPIRES_IN=1h
```

**mcp/.env:**
```env
PORT=8080
NODE_ENV=development
BACKEND_PORT=8000
BACKEND_URL=http://localhost
MAX_HISTORY_MESSAGES=5
MODEL=gemini-2.5-flash
MONGODB_URI=mongodb://root:password@localhost:27017/notesapp?authSource=admin
GEMINI_API_KEY=your_api_key
```

### 3. Run with Docker
```bash
docker-compose up -d
```

Access the app:
- **Frontend**: http://localhost:3000

Sign Up:

Enter your email,
your password (should be at least 6 characters, for test you may try "password")  
and your name.

## Architecture Overview

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| Frontend | React + TypeScript | 3000 | UI for notes management |
| Backend | Express + PostgreSQL | 8000 | REST API for notes/folders/tags |
| MCP Server | Express + MongoDB | 8080 | AI assistant with tool execution |

## Key Features

### AI Assistant
- **Natural Language Processing**: Understands commands like "Create a note about project X in folder Y"
- **Tool Use**: Automatically executes backend operations (create/update/delete notes, folders, tags)
- **RAG (Context Awareness)**: Fetches user's existing notes, folders, and tags for smarter decisions
- **Action History**: Tracks AI actions for reverting if needed

### Tool Execution Flow
1. User sends message to AI
2. AI analyzes request and selects appropriate tool (create-note, update-note, etc.)
3. Tool executes via Backend API
4. Action recorded in MongoDB with inverse operation for reverting
5. AI generates response

### RAG (Retrieval-Augmented Generation)
When processing requests, the AI gets context about:
- All user's existing notes (titles + IDs)
- All user's folders 

This allows the AI to avoid duplicates, suggest relevant folders/tags, and make better decisions.

### Revert Feature
Every AI action is recorded with an "inverse operation":
Users can revert the last AI action.


