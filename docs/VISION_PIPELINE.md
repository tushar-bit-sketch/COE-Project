# SENTINEL-X V2 · Computer Vision & Tracking Pipeline

## 1. Mathematical Formulation

### 1.1 State Representation
The kinematic state of target \(i\) at frame \(k\) is modeled as a 6-dimensional continuous vector:
\[
\mathbf{x}_k = \begin{bmatrix} c_x & c_y & w & h & v_x & v_y \end{bmatrix}^T
\]
where:
- \((c_x, c_y)\) is the target bounding box centroid.
- \((w, h)\) are the width and height of the bounding envelope.
- \((v_x, v_y)\) are the instantaneous pixel velocities along the X and Y axes.

### 1.2 State Transition (Prediction Step)
When direct visual observation is temporarily unavailable (e.g., occlusion by physical barriers):
\[
\mathbf{x}_k = \mathbf{F} \mathbf{x}_{k-1} + \mathbf{w}_k
\]
\[
\mathbf{P}_k = \mathbf{F} \mathbf{P}_{k-1} \mathbf{F}^T + \mathbf{Q}
\]
where:
- \(\mathbf{F}\) is the linear constant-velocity state transition matrix.
- \(\mathbf{P}\) is the error covariance matrix.
- \(\mathbf{Q}\) is the process noise covariance matrix representing model uncertainty.

During occlusion, the UI indicates:
> **"PREDICTION ACTIVE · DIRECT OBSERVATION LOST"**
Uncertainty \(\mathrm{Tr}(\mathbf{P})\) expands dynamically until either the target is reacquired or the track exceeds timeout and transitions to `LOST`.

### 1.3 Measurement Update (Correction Step)
When a detection \(\mathbf{z}_k = [c_x, c_y, w, h]^T\) is associated with the track:
\[
\mathbf{K}_k = \mathbf{P}_k \mathbf{H}^T (\mathbf{H} \mathbf{P}_k \mathbf{H}^T + \mathbf{R})^{-1}
\]
\[
\mathbf{x}_k = \mathbf{x}_k + \mathbf{K}_k (\mathbf{z}_k - \mathbf{H} \mathbf{x}_k)
\]
\[
\mathbf{P}_k = (\mathbf{I} - \mathbf{K}_k \mathbf{H}) \mathbf{P}_k
\]
where:
- \(\mathbf{K}\) is the Kalman gain.
- \(\mathbf{R}\) is the sensor measurement noise covariance.

---

## 2. Detection Association (IoU Tracker)

Track association across consecutive frames uses an Intersection-over-Union (IoU) spatial overlap cost matrix:
\[
\mathrm{IoU}(A, B) = \frac{\mathrm{Area}(A \cap B)}{\mathrm{Area}(A \cup B)}
\]
- Gating threshold: \(\mathrm{IoU} \ge 0.25\).
- Greedy assignment prioritizes established tracks (ordered by track age).
- Unassigned detections spawn new candidate tracks initialized in `DETECTED` state.
- Unmatched tracks enter `OCCLUDED` / `PREDICTED` state.

---

## 3. Behavioral Anomaly Classification

The anomaly engine calculates statistical \(z\)-scores over a rolling 50-frame velocity window:
\[
z = \frac{v_k - \mu_v}{\sigma_v + \epsilon}
\]
- If \(z > 2.8\sigma\) or \(v_k > 7.0 \text{ px/f}\): Classifies `VELOCITY_SPIKE` / `UNUSUAL_MOVEMENT`.
- If heading reversal angle \(\theta > 115^\circ\) in \(\le 6\) frames: Classifies `SUDDEN_DIRECTION_CHANGE`.
- If dwell duration \(> 300\) frames with displacement \(< 0.35 \text{ px/f}\): Classifies `EXTENDED_LOITERING`.

All classifications are neutral, objective kinematic outputs and require operator verification.
