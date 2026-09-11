# SENTINEL-X V2 · System Architecture Document

## 1. Executive Summary

SENTINEL-X is an autonomous surveillance intelligence platform engineered for outdoor human-target detection, persistent tracking, occlusion state estimation, behavioral anomaly classification, and real-time operator situational awareness.

V2 transforms the single-file prototype into a modular, server-based monorepo architecture with a real-time event pipeline, persistent database storage, deterministic simulation scenarios, and human-in-the-loop operational workflows.

---

## 2. High-Level Monorepo Architecture

```
sentinel-x/
│
├── apps/
│   ├── web/                     # React 18 SPA + Vite + Tailwind CSS + Zustand
│   │   ├── src/
│   │   │   ├── components/      # VideoStage, TargetCard, RadarPanel, Pipeline, etc.
│   │   │   ├── layouts/         # AppShell, TopNavigation, SystemStatusBar
│   │   │   ├── pages/           # 9 Dedicated Operational Routes
│   │   │   ├── services/        # REST API client, WebSocket client, Browser Vision
│   │   │   ├── stores/          # Zustand State Stores (Auth, Surveillance)
│   │   │   └── styles/          # Dark tactical tokens, scanlines, animations
│   │   └── package.json
│   │
│   └── server/                  # Node.js + Express + WebSocket + Prisma
│       ├── src/
│       │   ├── config/          # Zod environment validation
│       │   ├── controllers/     # Auth, Sources, Targets, Events, System, Analytics
│       │   ├── database/        # Prisma Client instantiation
│       │   ├── middleware/      # JWT auth, request logger, error handling
│       │   ├── routes/          # /api/v1 versioned REST endpoints
│       │   ├── services/        # Simulation, Anomaly, Alert, Tracking services
│       │   └── websocket/       # Real-time WebSocket broadcasting & message handling
│       ├── prisma/              # schema.prisma, migrations, seeds
│       └── package.json
│
├── packages/
│   └── shared/                  # Type definitions, 6-state Kalman math, IoU Tracker
│       ├── src/
│       │   ├── types/           # Target, Observation, Source, Event, Anomaly
│       │   ├── math/            # Kalman Filter, IoU geometry, multi-target tracker
│       │   └── contracts/       # WebSocket schemas, REST Zod payloads
│       └── package.json
│
├── database/                    # PostgreSQL init scripts
├── docs/                        # Architecture, API, Vision, Development documentation
├── scripts/                     # Python YOLOv8 + DeepSORT hardware bridge
├── docker-compose.yml           # Production multi-container composition
├── Dockerfile                   # Multi-stage production container build
├── .env.example                 # Environment variable specification
└── README.md                    # Project overview & operator guide
```

---

## 3. Computer Vision & Tracking Abstraction

The tracking subsystem is decoupled from specific camera hardware:

```
[Optical Source: Simulation | Webcam | MJPEG | Python GPU Bridge]
                         │
                         ▼ (Raw Frame / Sensor Ingest)
             [Person Detection Engine]
             (COCO-SSD / YOLOv8 / Synthetic)
                         │
                         ▼ (Bounding Box Detections [cx, cy, w, h, conf])
             [Detection Gating & Filtering]
                         │
                         ▼
        [IoU Matrix & Greedy Association Tracker]
                         │
                         ▼
      [6-State Kalman State Estimator & Velocity Filter]
      ┌──────────────────────────────────────────────────┐
      │ Direct Observation: Kalman State Update (K-Gain) │
      │ Occlusion Active:   Kalman State Predict (dt)    │
      └──────────────────────────────────────────────────┘
                         │
                         ▼
         [Statistical Anomaly & Threat Engine]
                         │
                         ▼
       [Alert Service & Centralized WebSocket Server]
                         │
                         ▼
         [High-Density Tactical Operator HUD]
```

---

## 4. Target State Machine

The platform enforces an explicit target state machine in application logic:

- **`DETECTED`**: Initial visual detection by neural model.
- **`TRACKING`**: Confirmed target across consecutive frames with associated trajectory.
- **`LOCKED`**: Operator has acquired explicit lock for focused monitoring.
- **`OCCLUDED`**: Target enters visual obstruction (1–3 missed frames).
- **`PREDICTED`**: Direct observation lost; 6-state Kalman filter actively projects expected position and velocity forward with increasing covariance uncertainty.
- **`REACQUIRED`**: New visual observation matches previous track within spatial tolerance; returns target to `TRACKING`.
- **`ANOMALY`**: Movement exceeds statistical baseline (velocity spike, sudden directional reversal, prolonged dwell).
- **`LOST`**: Occlusion exceeds prediction timeout threshold (default 35 frames / ~1.1s); track is formally terminated.

---

## 5. Security Architecture

- **Authentication**: JWT token verification with bcrypt-hashed credentials.
- **Role Clearance**: Role-based access control with clearance levels (`ALPHA-7`, `LEVEL-4`).
- **Data Protection**: Camera URLs and credentials are stored securely and never exposed in client bundles.
- **Audit Logging**: All security actions, target locks, alarms, and acknowledgments are persisted to the system event audit trail.
