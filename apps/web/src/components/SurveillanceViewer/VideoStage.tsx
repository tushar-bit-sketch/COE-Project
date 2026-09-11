import React, { useEffect, useRef, useState } from 'react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';
import { browserVisionProvider } from '../../services/vision/BrowserVisionProvider.js';
import { TargetData } from '@sentinel/shared';
import { AlarmBanner } from './AlarmBanner.js';
import { SimulationControls } from './SimulationControls.js';

export const VideoStage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mjpegRef = useRef<HTMLImageElement | null>(null);

  const {
    telemetry,
    targets,
    lockedTargetId,
    setLock,
    activeSource,
    selectedCamTab,
    setSelectedCamTab,
    addEventLog,
  } = useSurveillanceStore();

  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  const isSimulation = !activeSource || activeSource.type === 'SIMULATION';
  const isWebcam = activeSource?.type === 'WEBCAM';
  const isMjpeg = activeSource?.type === 'MJPEG';

  // Handle webcam stream initialization
  useEffect(() => {
    if (isWebcam) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then((stream) => {
          setWebcamStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          addEventLog('Webcam stream established — initializing AI model', 'ok');
        })
        .catch((err) => {
          console.warn('Webcam permission error:', err);
          addEventLog(`Camera permission error: ${err.message}`, 'danger');
        });

      // Load client model if not ready
      if (!browserVisionProvider.getIsReady()) {
        setIsLoadingModel(true);
        browserVisionProvider
          .load()
          .then((success) => {
            setIsLoadingModel(false);
            if (!success) setModelError('Failed to load TensorFlow model');
          })
          .catch((err) => {
            setIsLoadingModel(false);
            setModelError(err.message);
          });
      }
    } else {
      if (webcamStream) {
        webcamStream.getTracks().forEach((t) => t.stop());
        setWebcamStream(null);
      }
    }

    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isWebcam]);

  // Canvas Click to Lock/Unlock Target
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let hitTarget: TargetData | null = null;
    let bestDist = 999999;

    for (const target of targets) {
      if (!target.box) continue;
      const { cx, cy, w, h } = target.box;
      if (mx >= cx - w / 2 && mx <= cx + w / 2 && my >= cy - h / 2 && my <= cy + h / 2) {
        const dist = Math.hypot(mx - cx, my - cy);
        if (dist < bestDist) {
          bestDist = dist;
          hitTarget = target;
        }
      }
    }

    if (hitTarget) {
      if (lockedTargetId === hitTarget.id) {
        setLock(null);
      } else {
        setLock(hitTarget.id);
      }
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const render = () => {
      frameCount++;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // 1. Render Background Feed
      if (isSimulation) {
        // Synthetic tactical terrain background (faithful to V1 prototype)
        const grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, '#0a1520');
        grd.addColorStop(1, '#06101a');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        // Tactical coordinate grid
        ctx.strokeStyle = 'rgba(56, 217, 245, 0.04)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += W * 0.06) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += H * 0.1) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }

        // Perimeter tree tree silhouettes
        const treeBase = H;
        const treeTip = H * 0.5;
        for (let i = 0; i < 14; i++) {
          ctx.fillStyle = i % 2 ? 'rgba(15, 50, 35, 0.7)' : 'rgba(20, 40, 28, 0.7)';
          const x = (W / 14) * i + (i % 2) * W * 0.015;
          const tw = W * 0.06;
          ctx.beginPath();
          ctx.moveTo(x, treeBase);
          ctx.lineTo(x + tw * 0.45, treeTip + (i % 3) * H * 0.05);
          ctx.lineTo(x + tw, treeBase);
          ctx.closePath();
          ctx.fill();
        }

        // Sector structure & building block (occlusion zone)
        ctx.fillStyle = 'rgba(18, 28, 38, 0.9)';
        ctx.fillRect(0, H * 0.76, W, H * 0.24);

        const bx = W * 0.44;
        const bw = W * 0.14;
        const bh = H * 0.52;
        ctx.fillStyle = 'rgba(30, 45, 30, 0.8)';
        ctx.fillRect(bx, H - bh, bw, bh);
        ctx.fillStyle = 'rgba(50, 70, 35, 0.9)';
        ctx.beginPath();
        ctx.arc(bx + bw * 0.5, H - bh, bw * 0.82, 0, Math.PI * 2);
        ctx.fill();

        // Lens vignette
        const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9);
        vg.addColorStop(0, 'transparent');
        vg.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      } else if (isWebcam && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, W, H);
      } else if (isMjpeg && mjpegRef.current && mjpegRef.current.complete) {
        ctx.drawImage(mjpegRef.current, 0, 0, W, H);
      } else {
        ctx.fillStyle = '#060f1c';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(56, 217, 245, 0.4)';
        ctx.font = "600 13px 'DM Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('Awaiting video stream telemetry...', W / 2, H / 2);
        ctx.textAlign = 'left';
      }

      // 2. Render Target Overlays (Bounding Boxes, Trajectories, Crosshairs)
      for (const target of targets) {
        drawTargetOverlay(ctx, target, frameCount, lockedTargetId, W, H, isSimulation);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [targets, lockedTargetId, isSimulation, isWebcam, isMjpeg]);

  // Helper: Draw single target on canvas
  const drawTargetOverlay = (
    ctx: CanvasRenderingContext2D,
    t: TargetData,
    frame: number,
    lockedId: number | null,
    W: number,
    H: number,
    showWireframeRunner: boolean
  ) => {
    if (!t.box) return;

    const isLocked = lockedId !== null && t.id === lockedId;
    const isDimmed = lockedId !== null && t.id !== lockedId;
    const { cx, cy, w, h } = t.box;

    ctx.save();
    ctx.globalAlpha = isDimmed ? 0.25 : 1.0;

    // 1. Trail history
    if (!isDimmed && t.trail && t.trail.length > 1) {
      for (let i = 1; i < t.trail.length; i++) {
        const factor = i / t.trail.length;
        ctx.strokeStyle = t.col;
        ctx.globalAlpha = factor * 0.35 * (isDimmed ? 0.2 : 1);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(t.trail[i - 1].x, t.trail[i - 1].y);
        ctx.lineTo(t.trail[i].x, t.trail[i].y);
        ctx.stroke();
      }
    }

    // 2. Future Kalman predicted trajectory
    if (!isDimmed && t.predictedPath && t.predictedPath.length > 1) {
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(56, 217, 245, 0.45)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < t.predictedPath.length; i++) {
        const pt = t.predictedPath[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const x1 = cx - w / 2;
    const y1 = cy - h / 2;
    const boxColor = isLocked
      ? '#f87171'
      : t.anomaly
      ? '#f87171'
      : t.occluded
      ? '#f59e0b'
      : t.col;

    // 3. Occlusion Dash
    if (t.occluded && !isDimmed) {
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x1 - 8, y1 - 8, w + 16, h + 16);
      ctx.setLineDash([]);
    }

    // 4. Anomaly Radial Pulse
    if (t.anomaly && !isDimmed) {
      const pulseR = w / 2 + 14 + Math.sin(frame * 0.3) * 5;
      ctx.strokeStyle = `rgba(248, 113, 113, ${0.3 + Math.sin(frame * 0.4) * 0.15})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Box Background fill
    ctx.fillStyle = isLocked
      ? 'rgba(248, 113, 113, 0.08)'
      : t.anomaly
      ? 'rgba(248, 113, 113, 0.05)'
      : t.occluded
      ? 'rgba(245, 158, 11, 0.04)'
      : `${t.col}09`;
    ctx.fillRect(x1, y1, w, h);

    // 6. Corner Brackets
    const blen = Math.min(w, h) * 0.22;
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = isLocked ? 2.8 : t.anomaly ? 2.5 : 1.8;
    ctx.lineCap = 'round';

    const corners = [
      [x1, y1, 1, 0, 0, 1],
      [x1 + w, y1, -1, 0, 0, 1],
      [x1, y1 + h, 1, 0, 0, -1],
      [x1 + w, y1 + h, -1, 0, 0, -1],
    ];

    corners.forEach(([ox, oy, dx, dy, ex, ey]) => {
      ctx.beginPath();
      ctx.moveTo(ox + dx * blen, oy + dy * blen);
      ctx.lineTo(ox, oy);
      ctx.lineTo(ox + ex * blen, oy + ey * blen);
      ctx.stroke();
    });

    // 7. Tactical Tag Header
    const lbH = 20;
    const tagText = isLocked
      ? 'LOCKED'
      : t.state === 'LOST'
      ? 'LOST'
      : t.occluded
      ? 'KALMAN'
      : t.anomaly
      ? 'ANOMALY'
      : 'ACTIVE';

    ctx.fillStyle = isLocked
      ? 'rgba(100, 10, 20, 0.92)'
      : t.anomaly
      ? 'rgba(90, 10, 20, 0.88)'
      : t.occluded
      ? 'rgba(80, 55, 0, 0.85)'
      : 'rgba(2, 8, 20, 0.85)';
    ctx.fillRect(x1, y1 - lbH - 1, Math.max(w, 126), lbH);

    ctx.fillStyle = boxColor;
    ctx.font = "600 10px 'DM Mono', monospace";
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${t.label}  ${(t.conf * 100).toFixed(0)}%  ${tagText}`,
      x1 + 6,
      y1 - lbH / 2 - 1
    );

    // 8. Locked Crosshair Rotating Rings
    if (isLocked) {
      drawLockedCrosshair(ctx, cx, cy, frame);
    }

    // 9. Wireframe runner in simulation mode
    if (showWireframeRunner && !t.occluded && !isDimmed) {
      drawRunnerWireframe(ctx, cx, cy - h * 0.05, frame, t.anomaly ? '#f87171' : t.col);
    }

    ctx.restore();
  };

  const drawLockedCrosshair = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    frame: number
  ) => {
    const ang = frame * 0.04;
    const R = 22;
    const sp = 6;
    ctx.save();
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 8;
    ctx.translate(cx, cy);
    ctx.rotate(ang);

    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(
        0,
        0,
        R,
        (i / 4) * Math.PI * 2 + sp * 0.01,
        (i / 4 + 0.18) * Math.PI * 2 - sp * 0.01
      );
      ctx.stroke();
    }

    ctx.rotate(-ang);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.7)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.restore();
  };

  const drawRunnerWireframe = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    frame: number,
    col: string
  ) => {
    const phase = Math.sin(frame * 0.24);
    const r = 11;
    const lw = 2.4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(0, -r * 3.5, r, 0, Math.PI * 2);
    ctx.stroke();

    // Torso & Limbs
    ctx.beginPath();
    ctx.moveTo(0, -r * 2.3);
    ctx.lineTo(0, r * 0.9);
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(-r * 1.2, r * 0.4 + phase * r * 0.5);
    ctx.moveTo(0, -r * 0.6);
    ctx.lineTo(r * 1.2, r * 0.7 - phase * r * 0.5);
    ctx.moveTo(0, r * 0.9);
    ctx.lineTo(-r * 1.1, r * 3.2 - phase * r * 0.6);
    ctx.moveTo(0, r * 0.9);
    ctx.lineTo(r * 1.2, r * 3.4 + phase * r * 0.6);
    ctx.stroke();
    ctx.restore();
  };

  const leadTarget =
    lockedTargetId !== null
      ? targets.find((t) => t.id === lockedTargetId)
      : targets[0];

  return (
    <div className="panel viewer-panel p-4 border border-white/10 bg-black/40">
      {/* Panel Head */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-base font-bold text-white tracking-tight">
            Live Intelligence Feed
          </h3>
          <p className="text-xs font-mono text-muted">
            {isSimulation
              ? 'Simulation mode — multi-target tracking & Kalman state estimation'
              : `${activeSource?.name || 'Optical stream'} active`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="font-mono text-xs px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 text-cyan">
            {telemetry?.pipeline.totalMs ? `${telemetry.pipeline.totalMs} ms` : '-- ms'}
          </div>
        </div>
      </div>

      {/* Video Stage Container */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#030810] cursor-crosshair aspect-video">
        {/* Hidden video / image elements for webcam / MJPEG */}
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        {isMjpeg && (
          <img
            ref={mjpegRef}
            src={activeSource?.url}
            alt="MJPEG Feed"
            crossOrigin="anonymous"
            className="hidden"
          />
        )}

        {/* Master Canvas */}
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />

        {/* Top-Left Stage HUD */}
        <div className="absolute top-3 left-4 font-mono text-[0.62rem] text-cyan/70 flex items-center gap-3 z-20 pointer-events-none">
          <span>{isSimulation ? 'SIM' : 'OPTICAL'}</span>
          <span>FRAME {telemetry?.frame || 0}</span>
          {lockedTargetId !== null && (
            <span className="text-red font-bold animate-pulse">
              🔒 LOCKED #{lockedTargetId}
            </span>
          )}
        </div>

        {/* Top-Right Optical Cam Tabs */}
        <div className="absolute top-3 right-4 flex gap-1.5 z-20">
          {['A', 'B', 'C'].map((cam) => (
            <button
              key={cam}
              onClick={() => setSelectedCamTab(cam)}
              className={`font-mono text-[0.62rem] px-2.5 py-1 rounded-md border transition-all backdrop-blur-md ${
                selectedCamTab === cam
                  ? 'bg-cyan/20 border-cyan/40 text-cyan font-bold'
                  : 'bg-black/60 border-white/10 text-dim hover:text-white'
              }`}
            >
              CAM-{cam}
            </button>
          ))}
        </div>

        {/* Alarm Banner */}
        <AlarmBanner />

        {/* Bottom-Right Stage HUD */}
        <div className="absolute bottom-3 right-4 font-mono text-[0.62rem] text-cyan/60 flex items-center gap-4 z-20 pointer-events-none">
          <span>FRAME {telemetry?.frame || 0}</span>
          <span>
            {leadTarget
              ? `X:${leadTarget.box.cx.toFixed(0)} Y:${leadTarget.box.cy.toFixed(0)}`
              : '—'}
          </span>
          <span>
            {leadTarget
              ? `Vx:${leadTarget.vx.toFixed(2)} Vy:${leadTarget.vy.toFixed(2)}`
              : 'Vx:0 Vy:0'}
          </span>
        </div>

        {/* Loading / Error Overlays */}
        {isLoadingModel && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />
            <h4 className="font-display font-bold text-sm tracking-wider text-cyan">
              INITIALIZING NEURAL INFERENCE
            </h4>
            <p className="font-mono text-xs text-muted">
              Loading TensorFlow.js COCO-SSD mobile engine...
            </p>
          </div>
        )}
      </div>

      {/* Simulation Controls Bar (if in simulation mode) */}
      {isSimulation && <SimulationControls />}

      <div className="mt-2.5 text-[0.68rem] font-mono text-dim flex items-center justify-between">
        <span>
          Click target bounding box on feed to <span className="text-cyan">acquire/release target lock</span>.
        </span>
        <span className="text-dim/80">6-State Kalman state estimator active</span>
      </div>
    </div>
  );
};
