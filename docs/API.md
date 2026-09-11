# SENTINEL-X V2 · REST API & WebSocket Specification

All REST endpoints are versioned under `/api/v1`. Standard response envelopes:

**Success Envelope**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Envelope**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": { ... }
  }
}
```

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/login`
Authenticates operator with username and password.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "sentinel2025"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "username": "admin",
        "role": "ADMIN",
        "clearance": "ALPHA-7",
        "lastLoginAt": "2026-09-11T09:30:00Z"
      },
      "token": "jwt-token-string"
    }
  }
  ```

### `POST /api/v1/auth/logout`
Terminates operator session. Requires `Authorization: Bearer <token>`.

### `GET /api/v1/auth/session`
Returns current operator clearance profile.

---

## 2. Surveillance Sources Endpoints

### `GET /api/v1/sources`
Returns all configured camera sources and stream configurations.

### `POST /api/v1/sources`
Creates a new surveillance feed. Requires `ADMIN` clearance.
- **Body**: `{ "name": "Sector C", "type": "MJPEG", "url": "http://...", "resolution": "1280x720", "fps": 30 }`

### `POST /api/v1/sources/:id/test`
Performs ping and handshake connection test against stream endpoint.

### `POST /api/v1/sources/:id/start`
Activates camera source as primary intelligence feed.

### `POST /api/v1/sources/:id/stop`
Deactivates camera source.

---

## 3. Targets & Tracking Endpoints

### `GET /api/v1/targets`
Returns current active targets, confidence, kinematics, and locked target ID.

### `GET /api/v1/targets/:id`
Returns single target state and observation parameters.

### `POST /api/v1/targets/:id/lock`
Acquires tactical lock on target. Broadcasts `target:locked` event via WebSocket.

### `POST /api/v1/targets/:id/unlock`
Releases tactical lock on target.

### `GET /api/v1/targets/:id/history`
Returns historical trajectory points, velocity traces, and covariance uncertainty.

---

## 4. Security Events & Alarms Endpoints

### `GET /api/v1/events`
Query parameters:
- `severity`: `CRITICAL | HIGH | MEDIUM | LOW`
- `type`: `UNUSUAL_MOVEMENT | VELOCITY_SPIKE | SUDDEN_DIRECTION_CHANGE | EXTENDED_LOITERING`
- `acknowledged`: `true | false`
- `limit`: Default `50`

### `POST /api/v1/events/:id/acknowledge`
Operator acknowledges active alarm. Broadcasts `alarm:acknowledged` via WebSocket.

---

## 5. System Diagnostics Endpoints

### `GET /api/v1/system/health`
Health checks for database, core server, websocket, vision pipeline, and tracking engine.

### `GET /api/v1/system/metrics`
Memory usage (RSS, heap), CPU load, pipeline latencies, and uptime.

### `POST /api/v1/system/simulation`
Configures simulation scenario (`NORMAL_TRACK`, `OCCLUSION`, `REACQUISITION`, `ANOMALOUS_MOVEMENT`, `MULTIPLE_TARGETS`, `TARGET_LOST`) and speed factor.

---

## 6. Real-time WebSocket Specification (`/ws`)

### Telemetry Broadcast (`telemetry:tick`)
Broadcast to all connected clients at 30 FPS:
```json
{
  "type": "telemetry:tick",
  "timestamp": "2026-09-11T09:30:00Z",
  "data": {
    "telemetry": {
      "frame": 1420,
      "fps": 30.0,
      "targets": [...],
      "pipeline": {
        "detectionMs": 14.2,
        "trackingMs": 2.1,
        "kalmanMs": 1.0,
        "anomalyMs": 0.8,
        "totalMs": 18.1
      },
      "lockedTargetId": 17,
      "activeTargetCount": 3,
      "activeAlarms": [...]
    }
  }
}
```

### Client Messages to Server
- **Ping**: `{"type": "ping"}`
- **Lock Target**: `{"type": "target:lock", "targetId": 17}`
- **Acknowledge Alarm**: `{"type": "alarm:acknowledge", "alertId": "anom-123", "operator": "admin"}`
- **Simulation Control**: `{"type": "simulation:control", "action": "SCENARIO", "scenario": "OCCLUSION"}`
