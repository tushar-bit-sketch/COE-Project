import React, { useEffect, useRef } from 'react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

export const KalmanVelocityPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { targets, lockedTargetId } = useSurveillanceStore();

  const historyRef = useRef<{ m: number[]; p: number[] }>({ m: [], p: [] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Calculate current speed
    let currentSpeed = 0;
    const relevant =
      lockedTargetId !== null
        ? targets.filter((t) => t.id === lockedTargetId)
        : targets.filter((t) => t.state !== 'LOST');

    if (relevant.length > 0) {
      currentSpeed = relevant.reduce((acc, t) => acc + t.speed, 0) / relevant.length;
    }

    const prevPred = historyRef.current.p.slice(-1)[0] || 0;
    const predSpeed = currentSpeed * 0.6 + prevPred * 0.4;

    historyRef.current.m.push(currentSpeed);
    historyRef.current.p.push(predSpeed);

    if (historyRef.current.m.length > W) {
      historyRef.current.m.shift();
      historyRef.current.p.shift();
    }

    // Render Chart
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(3, 8, 16, 0.9)';
    ctx.fillRect(0, 0, W, H);

    // Anomaly danger zone shading
    ctx.fillStyle = 'rgba(248, 113, 113, 0.055)';
    ctx.fillRect(0, 0, W, H * 0.35);

    const maxV = Math.max(4.0, ...historyRef.current.m);
    const toY = (v: number) => H - (v / maxV) * H * 0.82 - H * 0.08;

    // Measured Speed Line (Cyan)
    if (historyRef.current.m.length > 1) {
      ctx.strokeStyle = 'rgba(56, 217, 245, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      historyRef.current.m.forEach((v, i) => {
        const x = W - historyRef.current.m.length + i;
        if (i === 0) ctx.moveTo(x, toY(v));
        else ctx.lineTo(x, toY(v));
      });
      ctx.stroke();
    }

    // Predicted Speed Line (Amber)
    if (historyRef.current.p.length > 1) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      historyRef.current.p.forEach((v, i) => {
        const x = W - historyRef.current.p.length + i;
        if (i === 0) ctx.moveTo(x, toY(v));
        else ctx.lineTo(x, toY(v));
      });
      ctx.stroke();
    }

    // Anomaly threshold dashed line (Red)
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, toY(3.0));
    ctx.lineTo(W, toY(3.0));
    ctx.stroke();
    ctx.setLineDash([]);
  }, [targets, lockedTargetId]);

  return (
    <div className="panel kf-panel p-4 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Kalman Velocity Trace
          </h3>
          <p className="text-[0.65rem] font-mono text-muted">
            {lockedTargetId !== null
              ? `Locked TGT-${String(lockedTargetId).padStart(3, '0')} · Kalman filter trace`
              : 'Measured vs predicted speed (all targets)'}
          </p>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={280}
        height={76}
        className="w-full h-[76px] rounded-lg border border-white/10 bg-[#030810]/80 block"
      />

      <div className="flex gap-3.5 mt-2 font-mono text-[0.58rem] text-dim">
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-3.5 h-0.5 rounded bg-cyan" />
          measured
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-3.5 h-0.5 rounded bg-amber" />
          predicted
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-3.5 h-0.5 rounded bg-red/60" />
          anomaly threshold
        </span>
      </div>
    </div>
  );
};
