import test from 'node:test';
import assert from 'node:assert';
import { MultiTargetTracker, Track } from '../dist/index.js';

test('Track lifecycle transitions: DETECTED -> TRACKING on multiple hits', () => {
  const trk = new Track(1, { cx: 100, cy: 100, w: 40, h: 80, conf: 0.9 });
  assert.strictEqual(trk.state, 'DETECTED');

  // Update track across consecutive frames
  for (let i = 0; i < 5; i++) {
    trk.update({ cx: 100 + i * 2, cy: 100, w: 40, h: 80, conf: 0.92 });
  }

  assert.strictEqual(trk.state, 'TRACKING');
  assert.strictEqual(trk.missed, 0);
  assert.strictEqual(trk.occluded, false);
});

test('Track lifecycle transitions: TRACKING -> OCCLUDED -> PREDICTED -> LOST on misses', () => {
  const trk = new Track(1, { cx: 100, cy: 100, w: 40, h: 80, conf: 0.9 }, {
    maxMissedFrames: 10,
    occlusionThresholdFrames: 3,
  });

  for (let i = 0; i < 4; i++) {
    trk.update({ cx: 100, cy: 100, w: 40, h: 80, conf: 0.9 });
  }
  assert.strictEqual(trk.state, 'TRACKING');

  // 1 miss -> OCCLUDED
  trk.predictOnly();
  assert.strictEqual(trk.state, 'OCCLUDED');
  assert.strictEqual(trk.occluded, true);

  // 3 misses -> PREDICTED
  trk.predictOnly();
  trk.predictOnly();
  assert.strictEqual(trk.state, 'PREDICTED');

  // Reach maxMissedFrames -> LOST
  for (let i = 0; i < 8; i++) {
    trk.predictOnly();
  }
  assert.strictEqual(trk.state, 'LOST');
  assert.strictEqual(trk.isDead, true);
});

test('Track reacquisition returns to REACQUIRED then TRACKING', () => {
  const trk = new Track(1, { cx: 100, cy: 100, w: 40, h: 80, conf: 0.9 });
  for (let i = 0; i < 4; i++) {
    trk.update({ cx: 100, cy: 100, w: 40, h: 80, conf: 0.9 });
  }

  // Go into occlusion
  trk.predictOnly();
  assert.strictEqual(trk.occluded, true);

  // Reacquire with new detection
  trk.update({ cx: 105, cy: 100, w: 40, h: 80, conf: 0.91 });
  assert.strictEqual(trk.state, 'REACQUIRED');
  assert.strictEqual(trk.occluded, false);

  // Next update returns to TRACKING
  trk.update({ cx: 107, cy: 100, w: 40, h: 80, conf: 0.92 });
  assert.strictEqual(trk.state, 'TRACKING');
});

test('MultiTargetTracker manages multiple tracks and sets lock', () => {
  const tracker = new MultiTargetTracker();

  // Frame 1: 2 detections
  const dets1 = [
    { cx: 100, cy: 100, w: 40, h: 80, conf: 0.9 },
    { cx: 400, cy: 200, w: 40, h: 80, conf: 0.88 },
  ];
  let tracks = tracker.update(dets1);
  assert.strictEqual(tracks.length, 2);

  const t1Id = tracks[0].id;
  tracker.setLock(t1Id);
  assert.strictEqual(tracker.getTrack(t1Id)?.isLocked, true);
  assert.strictEqual(tracker.getTrack(t1Id)?.state, 'LOCKED');

  tracker.setLock(null);
  assert.strictEqual(tracker.getTrack(t1Id)?.isLocked, false);
});
