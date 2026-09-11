import test from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../dist/config/env.js';
import { trackingService } from '../dist/services/tracking.service.js';
import { AnomalyEngine } from '../dist/services/anomaly.service.js';

test('Password hashing and validation for operator credentials', async () => {
  const hash = await bcrypt.hash('sentinel2025', 10);
  const isValid = await bcrypt.compare('sentinel2025', hash);
  const isInvalid = await bcrypt.compare('wrongpass', hash);

  assert.strictEqual(isValid, true);
  assert.strictEqual(isInvalid, false);
});

test('JWT signing and clearance verification', () => {
  const payload = {
    id: 'user-123',
    username: 'admin',
    role: 'ADMIN',
    clearance: 'ALPHA-7',
  };

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
  const verified = jwt.verify(token, env.JWT_SECRET) as typeof payload;

  assert.strictEqual(verified.username, 'admin');
  assert.strictEqual(verified.clearance, 'ALPHA-7');
});

test('TrackingService updates simulation cycle and sets target lock', async () => {
  const telemetry = await trackingService.tick();

  assert(telemetry.targets.length > 0, 'Simulation must produce active target tracks');
  assert(telemetry.pipeline.totalMs > 0, 'Pipeline latency must be calculated');

  const firstTargetId = telemetry.targets[0].id;
  const locked = trackingService.setLock(firstTargetId);

  assert.strictEqual(trackingService.getLockedTargetId(), firstTargetId);
  assert.strictEqual(locked?.isLocked, true);

  trackingService.setLock(null);
  assert.strictEqual(trackingService.getLockedTargetId(), null);
});

test('AnomalyEngine correctly identifies anomalous velocity spikes', () => {
  const engine = new AnomalyEngine(2.8);

  const normalTarget: any = {
    id: 1,
    label: 'TGT-001',
    speed: 1.2,
    aScore: 0.1,
    trail: [],
    dwellTime: 50,
  };

  const anomalousTarget: any = {
    id: 2,
    label: 'TGT-002',
    speed: 8.8, // Velocity spike > 7.0
    aScore: 0.95,
    trail: [],
    dwellTime: 50,
  };

  const normalRes = engine.evaluateTarget(normalTarget);
  assert.strictEqual(normalRes, null);

  const anomRes = engine.evaluateTarget(anomalousTarget);
  assert.notStrictEqual(anomRes, null);
  assert.strictEqual(anomRes?.isAnomaly, true);
  assert.strictEqual(anomRes?.type, 'VELOCITY_SPIKE');
  assert.strictEqual(anomRes?.severity, 'CRITICAL');
});
