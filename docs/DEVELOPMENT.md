# SENTINEL-X V2 · Development & Contribution Guide

## 1. Prerequisites

- **Node.js**: v20+ or v22+
- **npm**: v10+
- **Python**: 3.10+ (optional, only needed for GPU YOLOv8 bridge)

---

## 2. Quick Start (Zero External Services Needed)

The platform is designed to run locally out-of-the-box using SQLite and synthetic multi-target simulation:

```bash
# 1. Install dependencies across monorepo
npm install

# 2. Build shared mathematical contracts
npm run build --prefix packages/shared

# 3. Initialize & seed database
npm run db:generate --prefix apps/server
npm run db:push --prefix apps/server
npm run db:seed --prefix apps/server

# 4. Start concurrent development servers (Server on :3001, Web Client on :5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.
Default operator login credentials:
- **Username**: `admin`
- **Password**: `sentinel2025`
- **Clearance**: `ALPHA-7`

---

## 3. Package & Workspace Scripts

| Command | Action |
|---|---|
| `npm run dev` | Runs backend server (:3001) and web frontend (:5173) concurrently |
| `npm run dev:server` | Runs backend server with hot-reload |
| `npm run dev:web` | Runs Vite frontend development server |
| `npm run build` | Compiles TypeScript across all packages and bundles web application |
| `npm run test` | Runs unit and integration test suite |
| `npm run db:seed` | Seeds database with default admin credentials and camera sources |

---

## 4. Running with Docker Compose (PostgreSQL Production)

```bash
# Start PostgreSQL, Sentinel API Server, and Nginx Web Client
docker-compose up -d --build

# View logs
docker-compose logs -f
```

Endpoints when running in Docker:
- Web Application: `http://localhost:5173`
- API Backend: `http://localhost:3001/api/v1`
- PostgreSQL: `localhost:5432`

---

## 5. Running the Optional Python GPU Inference Bridge

For operators with NVIDIA CUDA GPUs who want YOLOv8 + DeepSORT hardware acceleration:

```bash
# Install Python requirements
pip install ultralytics deep-sort-realtime websockets opencv-python

# Start the bridge server
python scripts/sentinel_server.py --port 8765 --source 0 --conf 0.45
```
In the web interface, click **⚡ Python Backend** in the top navigation to connect to `ws://localhost:8765`.
