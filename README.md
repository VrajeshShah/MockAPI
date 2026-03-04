# MockAPI

A modular full-stack web application designed to create and serve mock API endpoints dynamically.

## Project Structure
- `frontend/`: React + TypeScript SPA (Vite).
- `backend/`: Hono + Bun server logic and SQLite database.
- `Dockerfile`: Multi-stage build for production.

## Project Overview
Each mock endpoint is identified by a unique, deterministic 10-character hash based on its definition.

### Key Technologies
- **Runtime:** [Bun.js](https://bun.sh/) (v1.3.10)
- **Backend:** [Hono](https://hono.dev/)
- **Database:** SQLite (via `bun:sqlite`)
- **Frontend:** [React](https://react.dev/)
- **ID Generation:** SHA-256 deterministic hashing

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed locally.

### Installation
```bash
# Install backend dependencies
cd backend && bun install

# Install frontend dependencies
cd ../frontend && bun install
```

### Development Mode
1.  **Backend:** 
    ```bash
    cd backend
    bun run index.ts
    ```
2.  **Frontend:** 
    ```bash
    cd frontend
    bun run dev
    ```

### Production Build
1.  **Build Frontend:**
    ```bash
    cd frontend
    bun run build
    ```
2.  **Start Unified Server:**
    ```bash
    cd ../backend
    bun run index.ts
    ```

### Docker
```bash
docker build -t mockapi .
docker run -p 3000:3000 mockapi
```

## Development Conventions

### Backend (`backend/src`)
- **Normalization:** JSON response bodies are minified before storage/hashing.
- **Security:** HTML response type is disabled to prevent XSS.
- **Cleanup:** A periodic task runs every 24 hours to remove expired records (7-day TTL).

### Frontend (`frontend/src`)
- **Responsive UI:** Modern 1200px grid layout on desktop, collapsing on mobile.
- **Base64:** Response bodies are encoded to base64 before being sent to the backend.

### Identification & Data
- **Hashes:** 10-character lowercase alphanumeric strings.
- **Storage:** Stored as base64 in SQLite and decoded on-the-fly.
