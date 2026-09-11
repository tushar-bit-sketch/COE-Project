import { Request, Response } from 'express';
import { SimulationConfigSchema } from '@sentinel/shared';
import { trackingService } from '../services/tracking.service.js';
import { prisma } from '../database/prisma.js';

export async function getSystemHealth(_req: Request, res: Response): Promise<void> {
  let dbStatus: 'ONLINE' | 'OFFLINE' = 'ONLINE';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'OFFLINE';
  }

  const telemetry = trackingService.getLatestTelemetry();

  res.json({
    success: true,
    data: {
      health: {
        backend: 'ONLINE',
        database: dbStatus,
        visionEngine: 'ONLINE',
        websocket: 'ONLINE',
        trackingEngine: 'ONLINE',
        pipelineStatus: telemetry?.pipeline.totalMs && telemetry.pipeline.totalMs > 100 ? 'DEGRADED' : 'ONLINE',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    },
  });
}

export async function getSystemMetrics(_req: Request, res: Response): Promise<void> {
  const mem = process.memoryUsage();
  const telemetry = trackingService.getLatestTelemetry();

  res.json({
    success: true,
    data: {
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
      pipeline: telemetry?.pipeline || {
        detectionMs: 0,
        trackingMs: 0,
        kalmanMs: 0,
        anomalyMs: 0,
        totalMs: 0,
      },
      activeTargets: telemetry?.activeTargetCount || 0,
      fps: telemetry?.fps || 30,
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
}

export async function getSystemStatus(_req: Request, res: Response): Promise<void> {
  const telemetry = trackingService.getLatestTelemetry();

  res.json({
    success: true,
    data: {
      status: telemetry?.systemHealth || 'ONLINE',
      mode: telemetry?.source.type || 'SIMULATION',
      activeSource: telemetry?.source.name || 'Simulation Alpha',
      activeTargetCount: telemetry?.activeTargetCount || 0,
      lockedTargetId: trackingService.getLockedTargetId(),
      simulationScenario: trackingService.getSimulationEngine().getScenario(),
    },
  });
}

export async function updateSimulation(req: Request, res: Response): Promise<void> {
  const parseResult = SimulationConfigSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid simulation parameters',
        details: parseResult.error.format(),
      },
    });
    return;
  }

  const { scenario, speed } = parseResult.data;

  if (scenario) {
    trackingService.setSimulationScenario(scenario);
  }

  if (speed !== undefined) {
    trackingService.setSimulationSpeed(speed);
  }

  res.json({
    success: true,
    data: {
      scenario: trackingService.getSimulationEngine().getScenario(),
      speed: trackingService.getSimulationEngine().getSpeed(),
    },
  });
}

export async function resetSimulation(_req: Request, res: Response): Promise<void> {
  trackingService.resetSimulation();

  res.json({
    success: true,
    data: { message: 'Simulation reset to nominal scenario bounds' },
  });
}

export async function toggleSimulationPause(_req: Request, res: Response): Promise<void> {
  const paused = trackingService.toggleSimulationPause();

  res.json({
    success: true,
    data: { paused },
  });
}
