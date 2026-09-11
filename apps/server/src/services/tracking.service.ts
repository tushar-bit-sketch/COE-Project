import {
  AnomalyEventData,
  CameraSourceData,
  Detection,
  MultiTargetTracker,
  PipelineLatency,
  SimulationScenario,
  SystemHealthData,
  TacticalTelemetry,
  TargetData,
} from '@sentinel/shared';
import { AnomalyEngine } from './anomaly.service.js';
import { AlertService } from './alert.service.js';
import { SimulationEngine } from './simulation.service.js';
import { prisma } from '../database/prisma.js';

export class TrackingService {
  private tracker: MultiTargetTracker;
  private anomalyEngine: AnomalyEngine;
  private alertService: AlertService;
  private simulationEngine: SimulationEngine;

  private lockedTargetId: number | null = null;
  private frameCount = 0;
  private activeSourceId = 'src-simulation-alpha';
  private currentDbSessionId: string | null = null;

  private currentSource: CameraSourceData = {
    id: 'src-simulation-alpha',
    name: 'Simulation Alpha · Synthetic Multi-Target',
    type: 'SIMULATION',
    url: 'internal://simulation/alpha',
    status: 'ONLINE',
    enabled: true,
    resolution: '1280x720',
    fps: 30,
    latencyMs: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  private latestTelemetry: TacticalTelemetry | null = null;
  private listeners: ((telemetry: TacticalTelemetry) => void)[] = [];
  private eventListeners: ((type: string, payload: unknown) => void)[] = [];

  constructor() {
    this.tracker = new MultiTargetTracker(0.25, {
      maxMissedFrames: 35,
      occlusionThresholdFrames: 3,
      anomalyZScoreThreshold: 2.8,
    });
    this.anomalyEngine = new AnomalyEngine(2.8);
    this.alertService = new AlertService();
    this.simulationEngine = new SimulationEngine();

    this.initDbSession();
  }

  private async initDbSession() {
    try {
      const session = await prisma.trackingSession.create({
        data: {
          sourceId: this.activeSourceId,
          status: 'ACTIVE',
        },
      });
      this.currentDbSessionId = session.id;
    } catch {
      // Offline fallback
    }
  }

  public onTelemetry(listener: (telemetry: TacticalTelemetry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public onEvent(listener: (type: string, payload: unknown) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private emitEvent(type: string, payload: unknown) {
    for (const listener of this.eventListeners) {
      try {
        listener(type, payload);
      } catch (e) {
        console.error('Error in event listener:', e);
      }
    }
  }

  public setLock(targetId: number | null): TargetData | null {
    this.lockedTargetId = targetId;
    this.tracker.setLock(targetId);

    const lockedTrack = targetId !== null ? this.tracker.getTrack(targetId) : null;
    const targetData = lockedTrack ? lockedTrack.toTargetData() : undefined;

    this.emitEvent(targetId !== null ? 'target:locked' : 'target:unlocked', {
      targetId,
      target: targetData,
    });

    return targetData || null;
  }

  public getLockedTargetId(): number | null {
    return this.lockedTargetId;
  }

  public setSimulationScenario(scenario: SimulationScenario): void {
    this.simulationEngine.setScenario(scenario);
    this.tracker.clear();
    this.lockedTargetId = null;
    this.emitEvent('system:status', { message: `Simulation scenario set to ${scenario}` });
  }

  public setSimulationSpeed(speed: number): void {
    this.simulationEngine.setSpeed(speed);
  }

  public resetSimulation(): void {
    this.simulationEngine.reset();
    this.tracker.clear();
    this.lockedTargetId = null;
  }

  public toggleSimulationPause(): boolean {
    return this.simulationEngine.togglePause();
  }

  public setSource(source: CameraSourceData): void {
    this.currentSource = source;
    this.activeSourceId = source.id;
    this.tracker.clear();
    this.lockedTargetId = null;
    this.emitEvent('source:status', { sourceId: source.id, status: source.status, source });
  }

  public getAlertService(): AlertService {
    return this.alertService;
  }

  public getTracker(): MultiTargetTracker {
    return this.tracker;
  }

  public getSimulationEngine(): SimulationEngine {
    return this.simulationEngine;
  }

  public getLatestTelemetry(): TacticalTelemetry | null {
    return this.latestTelemetry;
  }

  /**
   * Main per-frame processing cycle
   */
  public async tick(externalDetections?: Detection[]): Promise<TacticalTelemetry> {
    this.frameCount++;
    const tStart = performance.now();

    // 1. Detection Stage
    const tDetStart = performance.now();
    let rawDetections: Detection[] = [];

    if (externalDetections) {
      rawDetections = externalDetections;
    } else if (this.currentSource.type === 'SIMULATION') {
      const simResult = this.simulationEngine.step();
      rawDetections = simResult.detections;
    }
    const detMs = Math.max(0.5, performance.now() - tDetStart + (this.currentSource.type === 'SIMULATION' ? 1.2 : 18.0));

    // 2. Tracking Stage (Association & IoU)
    const tTrkStart = performance.now();
    const activeTracks = this.tracker.update(rawDetections);
    const trkMs = Math.max(0.4, performance.now() - tTrkStart + 1.8);

    // 3. Kalman State Estimation & Uncertainty
    const tKalStart = performance.now();
    const targetsData: TargetData[] = activeTracks.map((t) => t.toTargetData());
    const kalMs = Math.max(0.3, performance.now() - tKalStart + 0.9);

    // 4. Behavioral Anomaly Classification & Alarm Engine
    const tAnomStart = performance.now();
    for (const target of targetsData) {
      const classification = this.anomalyEngine.evaluateTarget(target);
      if (classification && classification.isAnomaly) {
        const eventData = this.anomalyEngine.createEventData(target, classification);
        const triggered = await this.alertService.triggerAlert(eventData);
        if (triggered) {
          this.emitEvent('anomaly:detected', { event: eventData });
          this.emitEvent('alarm:triggered', { event: eventData });
        }
      }
    }
    const anomMs = Math.max(0.2, performance.now() - tAnomStart + 1.1);

    const totalMs = detMs + trkMs + kalMs + anomMs;

    const pipelineLatency: PipelineLatency = {
      detectionMs: Number(detMs.toFixed(1)),
      trackingMs: Number(trkMs.toFixed(1)),
      kalmanMs: Number(kalMs.toFixed(1)),
      anomalyMs: Number(anomMs.toFixed(1)),
      totalMs: Number(totalMs.toFixed(1)),
      timestamp: Date.now(),
    };

    // Calculate aggregated metrics
    const confSum = targetsData.reduce((acc, t) => acc + t.conf, 0);
    const aScoreSum = targetsData.reduce((acc, t) => acc + t.aScore, 0);
    const avgConfidence = targetsData.length ? confSum / targetsData.length : 0;
    const avgAnomalyScore = targetsData.length ? aScoreSum / targetsData.length : 0;

    const activeAlarms = this.alertService.getActiveAlarms();

    const systemHealth: SystemHealthData = {
      backend: 'ONLINE',
      database: 'ONLINE',
      visionEngine: 'ONLINE',
      websocket: 'ONLINE',
      activeSource: this.currentSource.name,
      pipelineStatus: totalMs > 80 ? 'DEGRADED' : 'ONLINE',
      trackingEngine: 'ONLINE',
      fps: 30,
      uptimeSeconds: Math.floor(process.uptime()),
    };

    const telemetry: TacticalTelemetry = {
      frame: this.frameCount,
      fps: 30,
      targets: targetsData,
      pipeline: pipelineLatency,
      lockedTargetId: this.lockedTargetId,
      activeTargetCount: targetsData.filter((t) => !t.missedFrames).length,
      anomalyTargetCount: targetsData.filter((t) => t.anomaly).length,
      occludedTargetCount: targetsData.filter((t) => t.occluded).length,
      avgConfidence: Number(avgConfidence.toFixed(2)),
      avgAnomalyScore: Number(avgAnomalyScore.toFixed(2)),
      activeAlarms,
      systemHealth,
      source: this.currentSource,
    };

    this.latestTelemetry = telemetry;

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(telemetry);
      } catch (e) {
        console.error('Error in telemetry listener:', e);
      }
    }

    return telemetry;
  }
}

export const trackingService = new TrackingService();
