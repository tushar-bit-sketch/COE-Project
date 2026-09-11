/**
 * SENTINEL-X V2 Shared Types
 * Type definitions shared across Frontend, Backend, and Vision services.
 */

export type TargetState =
  | 'DETECTED'
  | 'TRACKING'
  | 'LOCKED'
  | 'OCCLUDED'
  | 'PREDICTED'
  | 'REACQUIRED'
  | 'ANOMALY'
  | 'LOST';

export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SourceType = 'SIMULATION' | 'WEBCAM' | 'MJPEG' | 'RTSP_BRIDGE';

export type SourceStatus = 'ONLINE' | 'CONNECTING' | 'OFFLINE' | 'DEGRADED' | 'ERROR';

export type AnomalyType =
  | 'NORMAL'
  | 'RAPID_MOVEMENT'
  | 'SUDDEN_DIRECTION_CHANGE'
  | 'RUNNING'
  | 'CROUCHING'
  | 'CRAWLING'
  | 'UNUSUAL_MOVEMENT'
  | 'EXTENDED_LOITERING'
  | 'VELOCITY_SPIKE';

export type SimulationScenario =
  | 'NORMAL_TRACK'
  | 'OCCLUSION'
  | 'REACQUISITION'
  | 'ANOMALOUS_MOVEMENT'
  | 'MULTIPLE_TARGETS'
  | 'TARGET_LOST';

export interface BoundingBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface Detection {
  cx: number;
  cy: number;
  w: number;
  h: number;
  conf: number;
  label?: string;
  sourceId?: string;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  t?: number;
}

export interface TargetObservation {
  id: string;
  targetId: string;
  timestamp: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  conf: number;
  vx: number;
  vy: number;
  trackingState: TargetState;
}

export interface TargetData {
  id: number;
  externalTrackId?: string;
  label: string;
  state: TargetState;
  col: string;
  box: BoundingBox;
  conf: number;
  vx: number;
  vy: number;
  speed: number;
  age: number;
  dwellTime: number;
  missedFrames: number;
  occluded: boolean;
  anomaly: boolean;
  aScore: number;
  behavior: string;
  threatLevel: ThreatLevel;
  threatScore: number;
  isLocked: boolean;
  trail: TrajectoryPoint[];
  predictedPath?: TrajectoryPoint[];
  firstDetectedAt: string;
  lastDetectedAt: string;
  covarianceTrace?: number;
}

export interface AnomalyEventData {
  id: string;
  targetId: number;
  targetLabel: string;
  type: AnomalyType;
  severity: ThreatLevel;
  confidence: number;
  description: string;
  reason?: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
}

export interface SystemEventData {
  id: string;
  type: string;
  message: string;
  severity: 'INFO' | 'WARN' | 'DANGER' | 'OK';
  timestamp: string;
  source?: string;
}

export interface CameraSourceData {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  status: SourceStatus;
  enabled: boolean;
  resolution: string;
  fps: number;
  latencyMs: number;
  lastFrameAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineLatency {
  detectionMs: number;
  trackingMs: number;
  kalmanMs: number;
  anomalyMs: number;
  totalMs: number;
  timestamp: number;
}

export interface SystemHealthData {
  backend: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  database: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  visionEngine: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  websocket: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  activeSource: string;
  pipelineStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  trackingEngine: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  fps: number;
  cpuLoadPercentage?: number;
  memoryUsageMb?: number;
  uptimeSeconds: number;
}

export interface UserSession {
  id: string;
  username: string;
  role: string;
  clearance: string;
  token?: string;
  lastLoginAt?: string;
}

export interface TacticalTelemetry {
  frame: number;
  fps: number;
  targets: TargetData[];
  pipeline: PipelineLatency;
  lockedTargetId: number | null;
  activeTargetCount: number;
  anomalyTargetCount: number;
  occludedTargetCount: number;
  avgConfidence: number;
  avgAnomalyScore: number;
  activeAlarms: AnomalyEventData[];
  systemHealth: SystemHealthData;
  source: CameraSourceData;
}
