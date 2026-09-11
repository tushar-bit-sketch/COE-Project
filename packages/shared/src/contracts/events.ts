import { z } from 'zod';
import {
  AnomalyEventData,
  CameraSourceData,
  PipelineLatency,
  SimulationScenario,
  SourceStatus,
  SystemEventData,
  SystemHealthData,
  TacticalTelemetry,
  TargetData,
} from '../types/index.js';

export const WsEventType = {
  TELEMETRY_TICK: 'telemetry:tick',
  TARGET_CREATED: 'target:created',
  TARGET_UPDATED: 'target:updated',
  TARGET_LOCKED: 'target:locked',
  TARGET_UNLOCKED: 'target:unlocked',
  TARGET_OCCLUDED: 'target:occluded',
  TARGET_REACQUIRED: 'target:reacquired',
  ANOMALY_DETECTED: 'anomaly:detected',
  ALARM_TRIGGERED: 'alarm:triggered',
  ALARM_ACKNOWLEDGED: 'alarm:acknowledged',
  SOURCE_STATUS: 'source:status',
  SYSTEM_STATUS: 'system:status',
  SIMULATION_CONTROL: 'simulation:control',
} as const;

export type WsEventType = (typeof WsEventType)[keyof typeof WsEventType];

export interface WsMessage<T = unknown> {
  type: WsEventType | string;
  timestamp: string;
  data: T;
}

export interface TelemetryTickPayload {
  telemetry: TacticalTelemetry;
}

export interface TargetEventPayload {
  target: TargetData;
}

export interface LockEventPayload {
  targetId: number | null;
  target?: TargetData;
}

export interface AnomalyEventPayload {
  event: AnomalyEventData;
}

export interface SourceStatusPayload {
  sourceId: string;
  status: SourceStatus;
  source: CameraSourceData;
}

export interface SystemStatusPayload {
  health: SystemHealthData;
  pipeline: PipelineLatency;
}

export interface SimulationControlMessage {
  action: 'START' | 'PAUSE' | 'RESET' | 'SCENARIO' | 'SPEED';
  scenario?: SimulationScenario;
  speed?: number;
}

// Zod Schemas for API Requests

export const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SourceCreateSchema = z.object({
  name: z.string().min(1, 'Source name is required'),
  type: z.enum(['SIMULATION', 'WEBCAM', 'MJPEG', 'RTSP_BRIDGE']),
  url: z.string().default(''),
  enabled: z.boolean().default(true),
  resolution: z.string().default('1280x720'),
  fps: z.number().default(30),
});

export type SourceCreateInput = z.infer<typeof SourceCreateSchema>;

export const SourceUpdateSchema = SourceCreateSchema.partial();
export type SourceUpdateInput = z.infer<typeof SourceUpdateSchema>;

export const TargetLockRequestSchema = z.object({
  targetId: z.number(),
});

export const EventAcknowledgeSchema = z.object({
  acknowledgedBy: z.string().optional(),
});

export const SimulationConfigSchema = z.object({
  scenario: z.enum([
    'NORMAL_TRACK',
    'OCCLUSION',
    'REACQUISITION',
    'ANOMALOUS_MOVEMENT',
    'MULTIPLE_TARGETS',
    'TARGET_LOST',
  ]).optional(),
  speed: z.number().min(0.1).max(5.0).optional(),
  targetCount: z.number().min(1).max(10).optional(),
});

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
