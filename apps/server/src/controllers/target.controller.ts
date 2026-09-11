import { Request, Response } from 'express';
import { trackingService } from '../services/tracking.service.js';

export async function listTargets(_req: Request, res: Response): Promise<void> {
  const telemetry = trackingService.getLatestTelemetry();
  const targets = telemetry?.targets || [];

  res.json({
    success: true,
    data: {
      targets,
      count: targets.length,
      lockedTargetId: trackingService.getLockedTargetId(),
    },
  });
}

export async function getTarget(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Target ID must be an integer' },
    });
    return;
  }

  const telemetry = trackingService.getLatestTelemetry();
  const target = telemetry?.targets.find((t) => t.id === id);

  if (!target) {
    res.status(404).json({
      success: false,
      error: { code: 'TARGET_NOT_FOUND', message: `Target #${id} is not currently active` },
    });
    return;
  }

  res.json({
    success: true,
    data: { target },
  });
}

export async function lockTarget(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Target ID must be an integer' },
    });
    return;
  }

  const target = trackingService.setLock(id);

  if (!target) {
    res.status(404).json({
      success: false,
      error: { code: 'TARGET_NOT_FOUND', message: `Target #${id} could not be acquired for lock` },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      locked: true,
      targetId: id,
      target,
    },
  });
}

export async function unlockTarget(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Target ID must be an integer' },
    });
    return;
  }

  const currentLocked = trackingService.getLockedTargetId();
  if (currentLocked === id) {
    trackingService.setLock(null);
  }

  res.json({
    success: true,
    data: {
      locked: false,
      targetId: id,
    },
  });
}

export async function getTargetHistory(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Target ID must be an integer' },
    });
    return;
  }

  const telemetry = trackingService.getLatestTelemetry();
  const target = telemetry?.targets.find((t) => t.id === id);

  res.json({
    success: true,
    data: {
      targetId: id,
      trail: target?.trail || [],
      predictedPath: target?.predictedPath || [],
      state: target?.state || 'UNKNOWN',
      firstDetectedAt: target?.firstDetectedAt || null,
      lastDetectedAt: target?.lastDetectedAt || null,
    },
  });
}
