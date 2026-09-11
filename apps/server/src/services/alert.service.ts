import { AnomalyEventData, ThreatLevel } from '@sentinel/shared';
import { prisma } from '../database/prisma.js';

export class AlertService {
  private activeAlarms: Map<string, AnomalyEventData> = new Map();
  private recentTriggerTimestamps: Map<number, number> = new Map(); // Debounce per target

  public getActiveAlarms(): AnomalyEventData[] {
    return Array.from(this.activeAlarms.values()).filter((a) => !a.acknowledged);
  }

  public async triggerAlert(
    alarmData: AnomalyEventData,
    targetDbId?: string
  ): Promise<AnomalyEventData | null> {
    const now = Date.now();
    const lastTrigger = this.recentTriggerTimestamps.get(alarmData.targetId) || 0;

    // Throttle alarms to 1 per 4 seconds per target for the same anomaly
    if (now - lastTrigger < 4000) {
      return null;
    }

    this.recentTriggerTimestamps.set(alarmData.targetId, now);
    this.activeAlarms.set(alarmData.id, alarmData);

    // Persist to database if targetDbId is provided
    try {
      if (targetDbId) {
        await prisma.anomalyEvent.create({
          data: {
            id: alarmData.id,
            targetId: targetDbId,
            targetTrackNum: alarmData.targetId,
            type: alarmData.type,
            severity: alarmData.severity,
            confidence: alarmData.confidence,
            description: alarmData.description,
            timestamp: new Date(alarmData.timestamp),
            acknowledged: false,
          },
        });
      }
    } catch (e) {
      console.warn('Could not persist anomaly event to DB:', e);
    }

    return alarmData;
  }

  public async acknowledgeAlert(
    alertId: string,
    acknowledgedBy = 'admin'
  ): Promise<AnomalyEventData | null> {
    const alarm = this.activeAlarms.get(alertId);

    if (alarm) {
      alarm.acknowledged = true;
      alarm.acknowledgedBy = acknowledgedBy;
      alarm.acknowledgedAt = new Date().toISOString();
    }

    // Persist to database
    try {
      await prisma.anomalyEvent.updateMany({
        where: { id: alertId },
        data: {
          acknowledged: true,
          acknowledgedBy,
          acknowledgedAt: new Date(),
        },
      });

      // Also record system audit event
      await prisma.systemEvent.create({
        data: {
          type: 'ANOMALY',
          message: `Alert ${alertId} acknowledged by operator ${acknowledgedBy}`,
          severity: 'OK',
          source: 'ALERT_ENGINE',
        },
      });
    } catch (e) {
      console.warn('Could not update acknowledged status in DB:', e);
    }

    return alarm || null;
  }

  public clear(): void {
    this.activeAlarms.clear();
  }
}
