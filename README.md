# SENTINEL-X · Autonomous Surveillance Intelligence Platform

> **"Never lose a human target."**
> Production-grade surveillance intelligence platform featuring real-time person detection, 6-state Kalman prediction, multi-target IoU tracking, behavioral anomaly classification, click-to-lock acquisition, and multi-source surveillance management.

---

## 1. Overview & Architectural Evolution

**SENTINEL-X V2** evolves the single-file prototype into a full-stack, modular, server-based monorepo application. It preserves the tactical visual identity, high-density telemetry, and command-center interaction model of V1 while introducing enterprise-grade persistence, real-time WebSockets, versioned REST APIs, extensible vision architecture, and operator workflows.

```
Prototype V1 (Single HTML)
            ↓
Modular React SPA (apps/web)
            ↓
Node.js + Express + WebSocket Backend (apps/server)
            ↓
6-State Kalman Estimator + IoU Tracker (packages/shared)
            ↓
Prisma ORM Persistence (SQLite Local / PostgreSQL Production)
            ↓
Multi-Scenario Simulation + Live Optical Feed Pipeline
            ↓
SENTINEL-X V2 Command Platform
```

---

## 2. Core Concepts & Definitions

- **DETECTION**: A human target is currently detected by the neural vision model (COCO-SSD / YOLOv8).
- **TRACKING**: The tracking engine associates detections across consecutive frames using spatial overlap (IoU) and track lifecycle history.
- **PREDICTION**: When direct visual observation is obstructed, a 6-state Kalman filter projects the target's estimated position \((c_x, c_y)\) and velocity \((v_x, v_y)\) forward with expanding uncertainty bounds.
- **OCCLUSION**: The target is temporarily unavailable to optical sensors (e.g. passing behind physical barriers).
- **ANOMALY**: Kinematic behavior differing significantly from baseline distributions (velocity spikes, sudden direction reversals, prolonged dwell).
- **LOCK**: An operator explicitly acquires a target for focused monitoring (`POST /api/v1/targets/:id/lock`).
- **ALERT**: The system triggers operator-visible notifications with real server-side acknowledgment persistence.

---

## 3. Technology Stack

- **Frontend (`apps/web`)**:
  - React 18 / TypeScript / Vite
  - Tailwind CSS + Custom Dark Tactical Design Tokens
  - Zustand (State Management)
  - React Router v6 (9 Operational Routes)
  - HTML5 Hardware-Accelerated Canvas
  - Lucide Restrained Tactical Icons
  - In-Browser TensorFlow.js COCO-SSD (WebGPU / WebGL acceleration)
- **Backend (`apps/server`)**:
  - Node.js / TypeScript / Express
  - Native WebSocket Server (`ws`)
  - Prisma ORM (SQLite local development, PostgreSQL production ready)
  - Zod Request Validation
  - JWT Authentication & Bcrypt Password Hashing
  - Structured Logging & Centralized Error Middleware
- **Shared Library (`packages/shared`)**:
  - 6-State Kalman Filter mathematical implementation
  - IoU Bounding-Box Association Matrix
  - Target State Machine
  - TypeScript Interfaces & Contracts
- **External Hardware Bridge (`scripts/sentinel_server.py`)**:
  - Optional Python YOLOv8 + DeepSORT GPU streaming server

---

## 4. Application Routes

| Route | Functionality |
|---|---|
| **`/login`** | Secure tactical access terminal with clearance code verification & boot sequence |
| **`/dashboard`** | Full command-center bento grid (feed, heatmap, pipeline, metrics, radar, targets, timeline, CSI matrix, asset recon) |
| **`/monitor`** | Focused wide-angle tactical surveillance stream with kinematic inspector |
| **`/targets`** | Target intelligence registry with trajectory histories and lock controls |
| **`/events`** | Security audit log and anomaly alarm management with operator acknowledge actions |
| **`/sources`** | Surveillance feed manager (Simulation, Local Webcam, IP/MJPEG camera streams) |
| **`/analytics`** | Tracking continuity ratios, reacquisition success rates, dwell sector distributions |
| **`/system`** | System health diagnostics (DB, WebSocket, vision pipeline, memory, uptime) |
| **`/settings`** | Confidence gates, anomaly sigma thresholds, prediction limits, audio chimes |

---

## 5. Quick Start (Zero External Prerequisites)

The platform runs out-of-the-box on local systems using SQLite:

```bash
# 1. Install dependencies
npm install

# 2. Build shared mathematical contracts
npm run build --prefix packages/shared

# 3. Initialize and seed database
npm run db:generate --prefix apps/server
npm run db:push --prefix apps/server
npm run db:seed --prefix apps/server

# 4. Start concurrent development servers (Server :3001, Client :5173)
npm run dev
```

Open your browser to **`http://localhost:5173`**.

### Demo Credentials
- **Username**: `admin`
- **Password**: `sentinel2025`
- **Clearance**: `ALPHA-7`

---

## 6. Simulation Scenarios

Use the **Simulation Controls** bar on the dashboard to test specific computer-vision phenomena:
1. **Normal Patrol**: Multi-entity wandering patrol within sector bounds.
2. **Occlusion Test**: Target moves behind structure; Kalman projects trajectory forward with active prediction indicator.
3. **Reacquisition**: Target re-emerges from visual obstruction and seamlessly re-associates with prior track.
4. **Anomalous Shift**: Target undergoes sudden kinetic velocity spike and acute trajectory reversal, triggering threat alarms.
5. **Dense Cluster**: 6 entities in overlapping cross-paths testing IoU assignment resolution.
6. **Target Lost**: Target leaves monitored boundary and exceeds prediction timeout, transitioning from `PREDICTED` to `LOST`.

---

## 7. Testing

Run the test suite across mathematical models, state machine transitions, and server controllers:

```bash
# Run tests
npm run test
```

---

## 8. Docker Deployment

To launch the full stack with PostgreSQL:

```bash
docker-compose up -d --build
```
- Web Application: `http://localhost:5173`
- Backend REST API: `http://localhost:3001/api/v1`
- PostgreSQL: `localhost:5432`

---

## 9. Feature Matrix: Preserved vs Evolved

| Feature | Prototype V1 | SENTINEL-X V2 |
|---|---|---|
| **Architecture** | Single HTML file (2500 lines) | Modular monorepo (`apps/web`, `apps/server`, `packages/shared`) |
| **Backend** | None (client-only) | Full Node.js Express REST API + WebSocket server |
| **Persistence** | None (lost on refresh) | Prisma ORM with SQLite / PostgreSQL schemas |
| **Authentication** | Visual mock in JS | Real JWT authentication with bcrypt password hashing |
| **Target Locking** | UI variable | Server-backed state broadcast via WebSockets |
| **Kalman Filter** | Inline canvas script | Isolated 6-state mathematical module with uncertainty telemetry |
| **Anomaly Engine** | Client heuristic | Centralized server anomaly service with persistent audit logging |
| **Routing** | Single static view | 9 Dedicated Operational Routes with React Router v6 |
| **Camera Sources** | Hardcoded options | Dynamic source manager with ping latency measurement & stream testing |
| **Simulation** | Single continuous loop | 6 Deterministic operational scenarios with speed & pause controls |
