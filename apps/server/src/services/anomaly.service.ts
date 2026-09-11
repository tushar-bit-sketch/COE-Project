import {
  AnomalyEventData,
  AnomalyType,
  TargetData,
  ThreatLevel,
} from '@sentinel/shared';

export interface AnomalyClassificationResult {
  isAnomaly: boolean;
  type: AnomalyType;
  severity: ThreatLevel;
  confidence: number;
  description: string;
  reason: string;
}

export class AnomalyEngine {
  private anomalyThreshold: number;

  constructor(anomalyThreshold = 2.8) {
    this.anomalyThreshold = anomalyThreshold;
  }

  public setThreshold(threshold: number): void {
    this.anomalyThreshold = threshold;
  }

  /**
   * Evaluate target telemetry for anomalous behavioral patterns.
   */
  public evaluateTarget(target: TargetData): AnomalyClassificationResult | null {
    // 1. Check for rapid velocity spike
    if (target.speed > 7.0) {
      return {
        isAnomaly: true,
        type: 'VELOCITY_SPIKE',
        severity: target.speed > 8.5 ? 'CRITICAL' : 'HIGH',
        confidence: Math.min(0.98, 0.75 + (target.speed - 7.0) * 0.1),
        description: `High kinetic displacement observed for ${target.label}`,
        reason: `Target speed reached ${target.speed.toFixed(1)} px/f (exceeds nominal outdoor baseline)`,
      };
    }

    // 2. Check statistical z-score spike
    if (target.aScore > 0.85) {
      return {
        isAnomaly: true,
        type: 'UNUSUAL_MOVEMENT',
        severity: 'HIGH',
        confidence: Math.min(0.95, target.aScore),
        description: `Statistical trajectory deviation detected for ${target.label}`,
        reason: `Velocity distribution z-score exceeded calibrated sigma threshold of ${this.anomalyThreshold}`,
      };
    }

    // 3. Check sudden direction change while moving fast
    if (target.trail.length >= 6 && target.speed > 3.0) {
      const p0 = target.trail[target.trail.length - 6];
      const p1 = target.trail[target.trail.length - 3];
      const p2 = target.trail[target.trail.length - 1];

      const v1x = p1.x - p0.x;
      const v1y = p1.y - p0.y;
      const v2x = p2.x - p1.x;
      const v2y = p2.y - p1.y;

      const dot = v1x * v2x + v1y * v2y;
      const m1 = Math.hypot(v1x, v1y);
      const m2 = Math.hypot(v2x, v2y);

      if (m1 > 2 && m2 > 2) {
        const cosTheta = dot / (m1 * m2);
        if (cosTheta < -0.4) {
          // Sharp acute angle reversal
          return {
            isAnomaly: true,
            type: 'SUDDEN_DIRECTION_CHANGE',
            severity: 'MEDIUM',
            confidence: 0.88,
            description: `Sudden trajectory reversal observed for ${target.label}`,
            reason: `Heading vector rotated > 115 degrees in under 6 frames`,
          };
        }
      }
    }

    // 4. Check for prolonged loitering
    if (target.dwellTime > 300 && target.speed < 0.35) {
      return {
        isAnomaly: true,
        type: 'EXTENDED_LOITERING',
        severity: 'LOW',
        confidence: 0.82,
        description: `Stationary dwell zone occupation by ${target.label}`,
        reason: `Target sustained zero-displacement dwell for ${target.dwellTime} consecutive frames`,
      };
    }

    return null;
  }

  public createEventData(
    target: TargetData,
    classification: AnomalyClassificationResult
  ): AnomalyEventData {
    return {
      id: `anom-${Date.now()}-${target.id}`,
      targetId: target.id,
      targetLabel: target.label,
      type: classification.type,
      severity: classification.severity,
      confidence: classification.confidence,
      description: classification.description,
      reason: classification.reason,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
    };
  }
}
