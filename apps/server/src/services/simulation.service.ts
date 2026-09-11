import {
  BoundingBox,
  Detection,
  SimulationScenario,
} from '@sentinel/shared';

interface SimEntity {
  id: number;
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  conf: number;
  wAng: number;
  age: number;
  life: number;
  isOccluded: boolean;
  occTimer: number;
  isAnomaly: boolean;
  anomalyTimer: number;
  fadeTimer: number;
  isExiting: boolean;
}

export class SimulationEngine {
  private entities: SimEntity[] = [];
  private nextId = 1;
  private scenario: SimulationScenario = 'NORMAL_TRACK';
  private speed = 1.0;
  private isPaused = false;
  private bounds = { width: 960, height: 540 };
  private obstacle = { x: 420, y: 180, w: 140, h: 220 }; // Virtual obstacle for occlusion scenario

  constructor() {
    this.reset();
  }

  public setScenario(scenario: SimulationScenario): void {
    this.scenario = scenario;
    this.reset();
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(5.0, speed));
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public reset(): void {
    this.entities = [];
    this.nextId = 1;

    switch (this.scenario) {
      case 'NORMAL_TRACK':
        this.spawnNormalGroup(3);
        break;
      case 'OCCLUSION':
        this.spawnOcclusionScenario();
        break;
      case 'REACQUISITION':
        this.spawnReacquisitionScenario();
        break;
      case 'ANOMALOUS_MOVEMENT':
        this.spawnAnomalyScenario();
        break;
      case 'MULTIPLE_TARGETS':
        this.spawnNormalGroup(6);
        break;
      case 'TARGET_LOST':
        this.spawnTargetLostScenario();
        break;
    }
  }

  private spawnNormalGroup(count: number): void {
    const W = this.bounds.width;
    const H = this.bounds.height;

    for (let i = 0; i < count; i++) {
      const cx = (W / (count + 1)) * (i + 1) + (Math.random() - 0.5) * 60;
      const cy = 120 + Math.random() * (H - 240);
      this.entities.push(this.createEntity(cx, cy));
    }
  }

  private spawnOcclusionScenario(): void {
    // Spawn 1 lead entity heading straight toward the obstacle zone, and 1 patrol entity
    const target = this.createEntity(200, 290);
    target.vx = 2.2;
    target.vy = 0.1;
    this.entities.push(target);

    // Normal background entity
    const bg = this.createEntity(750, 180);
    bg.vx = -0.8;
    bg.vy = 0.5;
    this.entities.push(bg);
  }

  private spawnReacquisitionScenario(): void {
    const target = this.createEntity(380, 290);
    target.vx = 2.0;
    target.vy = 0.0;
    target.isOccluded = true;
    target.occTimer = 60; // 2 seconds occlusion, then reacquire
    this.entities.push(target);
  }

  private spawnAnomalyScenario(): void {
    const normal = this.createEntity(250, 200);
    this.entities.push(normal);

    const anomalous = this.createEntity(400, 320);
    anomalous.isAnomaly = true;
    anomalous.anomalyTimer = 80;
    anomalous.vx = 4.5;
    anomalous.vy = -3.2;
    this.entities.push(anomalous);
  }

  private spawnTargetLostScenario(): void {
    const target = this.createEntity(800, 300);
    target.vx = 2.8;
    target.vy = 0.2;
    target.isExiting = true;
    this.entities.push(target);
  }

  private createEntity(cx: number, cy: number): SimEntity {
    const ang = Math.random() * Math.PI * 2;
    const spd = 0.8 + Math.random() * 0.8;
    const w = 44 + Math.random() * 16;
    const h = w * (2.2 + Math.random() * 0.3);

    return {
      id: this.nextId++,
      cx,
      cy,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      w,
      h,
      conf: 0.85 + Math.random() * 0.12,
      wAng: Math.random() * Math.PI * 2,
      age: 0,
      life: 600 + Math.floor(Math.random() * 600),
      isOccluded: false,
      occTimer: 0,
      isAnomaly: false,
      anomalyTimer: 0,
      fadeTimer: 0,
      isExiting: false,
    };
  }

  /**
   * Advance simulation by 1 tick and return raw optical detections.
   */
  public step(): { detections: Detection[]; obstacle: BoundingBox; scenario: SimulationScenario } {
    if (this.isPaused) {
      return {
        detections: this.getVisibleDetections(),
        obstacle: {
          cx: this.obstacle.x + this.obstacle.w / 2,
          cy: this.obstacle.y + this.obstacle.h / 2,
          w: this.obstacle.w,
          h: this.obstacle.h,
        },
        scenario: this.scenario,
      };
    }

    const W = this.bounds.width;
    const H = this.bounds.height;
    const dt = this.speed;

    for (const entity of this.entities) {
      entity.age += dt;

      // Anomaly behavior
      if (entity.isAnomaly) {
        entity.anomalyTimer -= dt;
        if (entity.anomalyTimer <= 0) {
          entity.isAnomaly = false;
        } else {
          // Erratic motion
          entity.wAng += (Math.random() - 0.5) * 0.8;
          entity.vx += Math.cos(entity.wAng) * 0.4 * dt;
          entity.vy += Math.sin(entity.wAng) * 0.4 * dt;
        }
      } else {
        // Natural wandering steering
        entity.wAng += (Math.random() - 0.5) * 0.25;
        entity.vx += Math.cos(entity.wAng) * 0.05 * dt;
        entity.vy += Math.sin(entity.wAng) * 0.03 * dt;
      }

      // Speed cap
      const spd = Math.hypot(entity.vx, entity.vy);
      const maxSpd = entity.isAnomaly ? 6.5 : 2.4;
      if (spd > maxSpd) {
        const factor = maxSpd / spd;
        entity.vx *= factor;
        entity.vy *= factor;
      }

      // Slight damping
      entity.vx *= 0.992;
      entity.vy *= 0.992;

      // Update position
      entity.cx += entity.vx * dt;
      entity.cy += entity.vy * dt;

      // Boundary repulsion (unless exiting)
      if (!entity.isExiting) {
        const margin = 50;
        if (entity.cx < margin) entity.vx += 0.2 * dt;
        if (entity.cx > W - margin) entity.vx -= 0.2 * dt;
        if (entity.cy < margin + 40) entity.vy += 0.2 * dt;
        if (entity.cy > H - margin) entity.vy -= 0.2 * dt;
      }

      // Check obstacle occlusion in occlusion scenarios
      const inObstacle =
        entity.cx > this.obstacle.x &&
        entity.cx < this.obstacle.x + this.obstacle.w &&
        entity.cy > this.obstacle.y &&
        entity.cy < this.obstacle.y + this.obstacle.h;

      if (this.scenario === 'OCCLUSION' || this.scenario === 'REACQUISITION') {
        if (inObstacle && !entity.isOccluded) {
          entity.isOccluded = true;
          entity.occTimer = 50; // duration behind obstacle
        }
      }

      if (entity.isOccluded) {
        entity.occTimer -= dt;
        if (entity.occTimer <= 0 && !inObstacle) {
          entity.isOccluded = false;
        }
      }
    }

    // Auto-respawn in continuous normal mode if targets drop low
    if (this.scenario === 'NORMAL_TRACK' && this.entities.length < 3) {
      this.entities.push(this.createEntity(100 + Math.random() * (W - 200), 100 + Math.random() * (H - 200)));
    }

    return {
      detections: this.getVisibleDetections(),
      obstacle: {
        cx: this.obstacle.x + this.obstacle.w / 2,
        cy: this.obstacle.y + this.obstacle.h / 2,
        w: this.obstacle.w,
        h: this.obstacle.h,
      },
      scenario: this.scenario,
    };
  }

  private getVisibleDetections(): Detection[] {
    const visible: Detection[] = [];

    for (const e of this.entities) {
      // If occluded or off-screen, camera cannot directly observe it
      if (e.isOccluded) continue;
      if (e.cx < -50 || e.cx > this.bounds.width + 50 || e.cy < -50 || e.cy > this.bounds.height + 50) {
        continue;
      }

      // Add minor sensor jitter to simulate realistic computer-vision bounding box noise
      const jitterX = (Math.random() - 0.5) * 1.5;
      const jitterY = (Math.random() - 0.5) * 1.5;

      visible.push({
        cx: e.cx + jitterX,
        cy: e.cy + jitterY,
        w: e.w,
        h: e.h,
        conf: Math.min(0.99, Math.max(0.65, e.conf + (Math.random() - 0.5) * 0.05)),
        label: 'person',
      });
    }

    return visible;
  }

  public getScenario(): SimulationScenario {
    return this.scenario;
  }

  public getSpeed(): number {
    return this.speed;
  }
}
