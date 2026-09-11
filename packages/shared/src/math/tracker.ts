import { BoundingBox, Detection, TargetData, TargetState, ThreatLevel, TrajectoryPoint } from '../types/index.js';
import { KalmanFilter } from './kalman.js';

export const COLOR_PALETTE = [
  '#38d9f5', // cyan
  '#34d399', // emerald
  '#f59e0b', // amber
  '#a78bfa', // violet
  '#f87171', // rose/red
  '#60a5fa', // blue
  '#a3e635', // lime
  '#fb923c', // orange
];

/**
 * Calculate Intersection-over-Union (IoU) between two bounding boxes
 */
export function iou(a: BoundingBox, b: BoundingBox): number {
  const ax1 = a.cx - a.w / 2;
  const ay1 = a.cy - a.h / 2;
  const ax2 = a.cx + a.w / 2;
  const ay2 = a.cy + a.h / 2;

  const bx1 = b.cx - b.w / 2;
  const by1 = b.cy - b.h / 2;
  const bx2 = b.cx + b.w / 2;
  const by2 = b.cy + b.h / 2;

  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
  const inter = ix * iy;
  const union = a.w * a.h + b.w * b.h - inter;

  return union > 0 ? inter / union : 0;
}

export interface TrackOptions {
  maxMissedFrames?: number;
  occlusionThresholdFrames?: number;
  anomalyZScoreThreshold?: number;
}

export class Track {
  public id: number;
  public label: string;
  public col: string;
  public kf: KalmanFilter;
  public box: BoundingBox;
  public conf: number;
  public missed: number;
  public age: number;
  public dwellTime: number;
  public state: TargetState;
  public trail: TrajectoryPoint[];
  public occluded: boolean;
  public anomaly: boolean;
  public aScore: number;
  public speedHist: number[];
  public behavior: string;
  public threatLevel: ThreatLevel;
  public threatScore: number;
  public isLocked: boolean;
  public firstDetectedAt: string;
  public lastDetectedAt: string;

  private maxMissed: number;
  private occThreshold: number;
  private anomalyZ: number;

  constructor(id: number, det: Detection, options: TrackOptions = {}) {
    this.id = id;
    this.label = `TGT-${String(id).padStart(3, '0')}`;
    this.col = COLOR_PALETTE[id % COLOR_PALETTE.length];
    this.box = { cx: det.cx, cy: det.cy, w: det.w, h: det.h };
    this.kf = new KalmanFilter(this.box);
    this.conf = det.conf;
    this.missed = 0;
    this.age = 1;
    this.dwellTime = 1;
    this.state = 'DETECTED';
    this.trail = [{ x: det.cx, y: det.cy }];
    this.occluded = false;
    this.anomaly = false;
    this.aScore = 0;
    this.speedHist = [];
    this.behavior = 'NORMAL';
    this.threatLevel = 'LOW';
    this.threatScore = 0;
    this.isLocked = false;
    this.firstDetectedAt = new Date().toISOString();
    this.lastDetectedAt = new Date().toISOString();

    this.maxMissed = options.maxMissedFrames ?? 30;
    this.occThreshold = options.occlusionThresholdFrames ?? 3;
    this.anomalyZ = options.anomalyZScoreThreshold ?? 2.8;
  }

  public update(det: Detection): void {
    const wasOccluded = this.occluded;
    this.missed = 0;
    this.conf = det.conf;
    this.lastDetectedAt = new Date().toISOString();

    // Kalman step
    this.kf.predict();
    this.kf.update({ cx: det.cx, cy: det.cy, w: det.w, h: det.h });
    this.box = { cx: this.kf.s.cx, cy: this.kf.s.cy, w: this.kf.s.w, h: this.kf.s.h };

    this.occluded = false;
    if (wasOccluded) {
      this.state = 'REACQUIRED';
    } else if (this.isLocked) {
      this.state = 'LOCKED';
    } else if (this.age > 3) {
      this.state = 'TRACKING';
    } else {
      this.state = 'DETECTED';
    }

    this.updateMotionAnalysis();
    this.updateTrail();
    this.classifyThreat();

    this.age++;
    this.dwellTime++;
  }

  public predictOnly(): void {
    this.missed++;
    this.kf.predict();
    this.box = { cx: this.kf.s.cx, cy: this.kf.s.cy, w: this.kf.s.w, h: this.kf.s.h };

    if (this.missed >= this.maxMissed) {
      this.state = 'LOST';
    } else if (this.missed >= this.occThreshold) {
      this.occluded = true;
      this.state = 'PREDICTED';
    } else {
      this.occluded = true;
      this.state = 'OCCLUDED';
    }

    this.updateMotionAnalysis();
    this.updateTrail();
    this.classifyThreat();

    this.age++;
    this.dwellTime++;
  }

  private updateTrail(): void {
    this.trail.push({ x: this.box.cx, y: this.box.cy });
    if (this.trail.length > 40) {
      this.trail.shift();
    }
  }

  private updateMotionAnalysis(): void {
    const spd = this.kf.speed();
    this.speedHist.push(spd);
    if (this.speedHist.length > 50) {
      this.speedHist.shift();
    }

    if (this.speedHist.length < 8) {
      this.aScore = 0;
      this.anomaly = false;
      return;
    }

    const mean = this.speedHist.reduce((acc, v) => acc + v, 0) / this.speedHist.length;
    const variance =
      this.speedHist.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / this.speedHist.length;
    const std = Math.sqrt(variance) + 0.001;
    const z = (spd - mean) / std;

    this.aScore = Math.min(1.0, Math.max(0.0, z / this.anomalyZ));
    this.anomaly = z > this.anomalyZ || spd > 8.5;

    if (this.anomaly && !this.isLocked && this.state !== 'LOST') {
      this.state = 'ANOMALY';
    }

    if (this.occluded) {
      this.behavior = 'OCCLUSION ACTIVE';
    } else if (spd > 6.0) {
      this.behavior = 'RAPID MOVEMENT';
    } else if (spd > 3.2) {
      this.behavior = 'RUNNING';
    } else if (this.dwellTime > 180 && spd < 0.4) {
      this.behavior = 'EXTENDED DWELL';
    } else if (this.anomaly) {
      this.behavior = 'SUDDEN DIRECTION CHANGE';
    } else {
      this.behavior = 'NORMAL';
    }
  }

  private classifyThreat(): void {
    const spd = this.kf.speed();
    const score =
      this.aScore * 40 +
      Math.min(30, spd * 5) +
      (this.occluded ? 12 : 0) +
      (this.dwellTime > 200 ? 15 : 0) +
      (this.anomaly ? 25 : 0);

    this.threatScore = Math.min(100, Math.round(score));

    if (this.threatScore >= 75) {
      this.threatLevel = 'CRITICAL';
    } else if (this.threatScore >= 45) {
      this.threatLevel = 'HIGH';
    } else if (this.threatScore >= 20) {
      this.threatLevel = 'MEDIUM';
    } else {
      this.threatLevel = 'LOW';
    }
  }

  public toTargetData(): TargetData {
    return {
      id: this.id,
      label: this.label,
      state: this.state,
      col: this.col,
      box: { ...this.box },
      conf: this.conf,
      vx: this.kf.s.vx,
      vy: this.kf.s.vy,
      speed: this.kf.speed(),
      age: this.age,
      dwellTime: this.dwellTime,
      missedFrames: this.missed,
      occluded: this.occluded,
      anomaly: this.anomaly,
      aScore: this.aScore,
      behavior: this.behavior,
      threatLevel: this.threatLevel,
      threatScore: this.threatScore,
      isLocked: this.isLocked,
      trail: [...this.trail],
      predictedPath: this.kf.futurePositions(10),
      firstDetectedAt: this.firstDetectedAt,
      lastDetectedAt: this.lastDetectedAt,
      covarianceTrace: this.kf.uncertainty(),
    };
  }

  public get isDead(): boolean {
    return this.missed >= this.maxMissed;
  }
}

export class MultiTargetTracker {
  private tracks: Track[] = [];
  private nextId = 1;
  private iouThreshold: number;
  private options: TrackOptions;

  constructor(iouThreshold = 0.25, options: TrackOptions = {}) {
    this.iouThreshold = iouThreshold;
    this.options = options;
  }

  public update(detections: Detection[]): Track[] {
    // 1. Predict state for all existing tracks
    for (const track of this.tracks) {
      track.kf.predict();
    }

    const matchedTracks = new Set<number>();
    const usedDetections = new Set<number>();

    // 2. Sort tracks by age (prioritize seasoned tracks)
    const sortedTracks = [...this.tracks].sort((a, b) => b.age - a.age);

    // 3. Match existing tracks to detections by IoU
    for (const track of sortedTracks) {
      let bestIoU = this.iouThreshold;
      let bestDetIdx = -1;

      for (let i = 0; i < detections.length; i++) {
        if (usedDetections.has(i)) continue;
        const score = iou(track.box, detections[i]);
        if (score > bestIoU) {
          bestIoU = score;
          bestDetIdx = i;
        }
      }

      if (bestDetIdx >= 0) {
        track.update(detections[bestDetIdx]);
        matchedTracks.add(track.id);
        usedDetections.add(bestDetIdx);
      } else {
        track.predictOnly();
        matchedTracks.add(track.id);
      }
    }

    // 4. Create new tracks for unmatched detections
    for (let i = 0; i < detections.length; i++) {
      if (!usedDetections.has(i)) {
        const newTrack = new Track(this.nextId++, detections[i], this.options);
        this.tracks.push(newTrack);
      }
    }

    // 5. Prune dead tracks
    this.tracks = this.tracks.filter((t) => !t.isDead);

    return this.tracks;
  }

  public getTracks(): Track[] {
    return this.tracks;
  }

  public getTrack(id: number): Track | undefined {
    return this.tracks.find((t) => t.id === id);
  }

  public setLock(id: number | null): void {
    for (const track of this.tracks) {
      track.isLocked = id !== null && track.id === id;
      if (track.isLocked) {
        track.state = 'LOCKED';
      } else if (track.state === 'LOCKED') {
        track.state = track.occluded ? 'OCCLUDED' : 'TRACKING';
      }
    }
  }

  public clear(): void {
    this.tracks = [];
  }
}
