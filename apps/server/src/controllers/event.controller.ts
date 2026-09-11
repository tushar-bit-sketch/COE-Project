import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { trackingService } from '../services/tracking.service.js';

export async function listEvents(req: Request, res: Response): Promise<void> {
  const { severity, type, acknowledged, limit = '50' } = req.query;
  const take = Math.min(200, parseInt(limit as string, 10) || 50);

  try {
    const where: any = {};
    if (severity) where.severity = String(severity);
    if (type) where.type = String(type);
    if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true';

    const [anomalies, systemEvents] = await Promise.all([
      prisma.anomalyEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take,
      }),
      prisma.systemEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
    ]);

    res.json({
      success: true,
      data: {
        anomalies,
        systemEvents,
        activeAlarms: trackingService.getAlertService().getActiveAlarms(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve events' },
    });
  }
}

export async function getEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const event = await prisma.anomalyEvent.findUnique({
      where: { id },
    });

    if (!event) {
      res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { event },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve event' },
    });
  }
}

export async function acknowledgeEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const acknowledgedBy = req.user?.username || req.body.acknowledgedBy || 'admin';

  try {
    const alert = await trackingService.getAlertService().acknowledgeAlert(id, acknowledgedBy);

    res.json({
      success: true,
      data: {
        acknowledged: true,
        eventId: id,
        acknowledgedBy,
        alert,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ACKNOWLEDGE_FAILED', message: 'Failed to acknowledge alert' },
    });
  }
}
