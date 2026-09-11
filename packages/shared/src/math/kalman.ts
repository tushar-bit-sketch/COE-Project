import { BoundingBox, TrajectoryPoint } from '../types/index.js';

export interface KalmanState {
  cx: number;
  cy: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

export interface KalmanCovariance {
  cx: number;
  cy: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

/**
 * 6-State Linear Kalman Filter for 2D Bounding Box Tracking
 * State: [cx, cy, w, h, vx, vy]
 * Measurements: [cx, cy, w, h]
 */
export class KalmanFilter {
  public s: KalmanState;
  public P: KalmanCovariance;
  public Q: KalmanCovariance;
  public R: KalmanCovariance;
  private maxVelocity: number;
  private velocityAlpha: number;

  constructor(
    initBox: BoundingBox,
    options: {
      maxVelocity?: number;
      velocityAlpha?: number;
    } = {}
  ) {
    this.s = {
      cx: initBox.cx,
      cy: initBox.cy,
      w: initBox.w,
      h: initBox.h,
      vx: 0,
      vy: 0,
    };

    // Initial estimation error covariance
    this.P = {
      cx: 80,
      cy: 80,
      w: 60,
      h: 60,
      vx: 80,
      vy: 80,
    };

    // Process noise covariance (model uncertainty)
    this.Q = {
      cx: 0.7,
      cy: 0.7,
      w: 1.4,
      h: 1.4,
      vx: 2.0,
      vy: 2.0,
    };

    // Measurement noise covariance (sensor noise)
    this.R = {
      cx: 4.0,
      cy: 4.0,
      w: 10.0,
      h: 10.0,
      vx: 12.0,
      vy: 12.0,
    };

    this.maxVelocity = options.maxVelocity ?? 12.0;
    this.velocityAlpha = options.velocityAlpha ?? 0.5;
  }

  /**
   * Predict the next state forward by dt (default 1 step).
   * Increases uncertainty (P) by process noise (Q).
   */
  public predict(): BoundingBox {
    // State transition
    this.s.cx += this.s.vx;
    this.s.cy += this.s.vy;

    // Propagate covariance
    this.P.cx += this.Q.cx;
    this.P.cy += this.Q.cy;
    this.P.w += this.Q.w;
    this.P.h += this.Q.h;
    this.P.vx += this.Q.vx;
    this.P.vy += this.Q.vy;

    return {
      cx: this.s.cx,
      cy: this.s.cy,
      w: this.s.w,
      h: this.s.h,
    };
  }

  /**
   * Incorporate direct observation measurement into state estimate.
   */
  public update(measurement: BoundingBox): void {
    const keys: (keyof BoundingBox)[] = ['cx', 'cy', 'w', 'h'];

    for (const key of keys) {
      const z = measurement[key];
      const p = this.P[key];
      const r = this.R[key];
      const K = p / (p + r); // Kalman gain

      // Innovation update
      this.s[key] += K * (z - this.s[key]);
      this.P[key] *= (1 - K);
    }

    // Velocity update via smoothed finite difference
    const instantaneousVx = measurement.cx - (this.s.cx - this.s.vx);
    const instantaneousVy = measurement.cy - (this.s.cy - this.s.vy);

    const a = this.velocityAlpha;
    const mv = this.maxVelocity;

    this.s.vx = Math.max(-mv, Math.min(mv, a * instantaneousVx + (1 - a) * this.s.vx));
    this.s.vy = Math.max(-mv, Math.min(mv, a * instantaneousVy + (1 - a) * this.s.vy));

    // Update velocity covariance
    this.P.vx = Math.max(1, this.P.vx * 0.95);
    this.P.vy = Math.max(1, this.P.vy * 0.95);
  }

  /**
   * Return magnitude of estimated velocity vector.
   */
  public speed(): number {
    return Math.hypot(this.s.vx, this.s.vy);
  }

  /**
   * Return scalar uncertainty indicator (trace of positional covariance).
   */
  public uncertainty(): number {
    return Math.sqrt(this.P.cx * this.P.cx + this.P.cy * this.P.cy);
  }

  /**
   * Project trajectory steps forward without mutating filter state.
   */
  public futurePositions(steps = 10, decay = 0.92): TrajectoryPoint[] {
    const pts: TrajectoryPoint[] = [];
    let sx = this.s.cx;
    let sy = this.s.cy;
    let svx = this.s.vx;
    let svy = this.s.vy;

    for (let i = 1; i <= steps; i++) {
      sx += svx;
      sy += svy;
      svx *= decay;
      svy *= decay;
      pts.push({
        x: sx,
        y: sy,
        t: i / steps,
      });
    }

    return pts;
  }
}
