import test from 'node:test';
import assert from 'node:assert';
import { KalmanFilter, iou } from '../dist/index.js';

test('KalmanFilter initializes with given bounding box', () => {
  const kf = new KalmanFilter({ cx: 100, cy: 150, w: 40, h: 90 });
  assert.strictEqual(kf.s.cx, 100);
  assert.strictEqual(kf.s.cy, 150);
  assert.strictEqual(kf.s.w, 40);
  assert.strictEqual(kf.s.h, 90);
  assert.strictEqual(kf.s.vx, 0);
  assert.strictEqual(kf.s.vy, 0);
});

test('KalmanFilter state prediction propagates velocity and expands covariance', () => {
  const kf = new KalmanFilter({ cx: 100, cy: 100, w: 30, h: 60 });
  kf.s.vx = 2.0;
  kf.s.vy = -1.0;

  const initialP = kf.P.cx;
  const predicted = kf.predict();

  assert.strictEqual(predicted.cx, 102);
  assert.strictEqual(predicted.cy, 99);
  assert(kf.P.cx > initialP, 'Covariance uncertainty must increase during prediction');
});

test('KalmanFilter measurement update smooths velocity and contracts covariance', () => {
  const kf = new KalmanFilter({ cx: 100, cy: 100, w: 30, h: 60 });
  kf.predict();
  const preUpdateP = kf.P.cx;

  // Direct sensor measurement at x=105, y=102
  kf.update({ cx: 105, cy: 102, w: 30, h: 60 });

  assert(kf.P.cx < preUpdateP, 'Covariance uncertainty must decrease after direct sensor update');
  assert(kf.s.vx > 0, 'Velocity in X must be positive after displacement to the right');
  assert(kf.speed() > 0, 'Speed must be positive');
});

test('KalmanFilter future trajectory projection generates decaying future points', () => {
  const kf = new KalmanFilter({ cx: 200, cy: 200, w: 40, h: 80 });
  kf.s.vx = 3.0;
  kf.s.vy = 2.0;

  const future = kf.futurePositions(8);
  assert.strictEqual(future.length, 8);
  assert(future[0].x > 200);
  assert(future[7].x > future[0].x);
  assert.strictEqual(future[7].t, 1.0);
});

test('IoU calculation correctly evaluates overlapping and disjoint bounding boxes', () => {
  // Identical boxes
  const b1 = { cx: 50, cy: 50, w: 20, h: 20 };
  const b2 = { cx: 50, cy: 50, w: 20, h: 20 };
  assert.strictEqual(iou(b1, b2), 1.0);

  // Disjoint boxes
  const b3 = { cx: 100, cy: 100, w: 20, h: 20 };
  assert.strictEqual(iou(b1, b3), 0.0);

  // Partial overlap (50% area overlap)
  const b4 = { cx: 60, cy: 50, w: 20, h: 20 };
  const overlap = iou(b1, b4);
  assert(overlap > 0 && overlap < 1.0);
});
