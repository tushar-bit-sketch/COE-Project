import React, { useEffect, useRef } from 'react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

const HEAT_CAP = 1200;

export const MotionHeatmap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ringRef = useRef<Array<{ x: number; y: number; t: number } | null>>(
    new Array(HEAT_CAP).fill(null)
  );
  const headRef = useRef(0);
  const sizeRef = useRef(0);

  const { targets } = useSurveillanceStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const scW = 960;
    const scH = 540;

    // Push current targets to ring buffer
    const now = Date.now();
    targets
      .filter((t) => t.state !== 'LOST')
      .forEach((t) => {
        ringRef.current[headRef.current] = {
          x: (t.box.cx / scW) * W,
          y: (t.box.cy / scH) * H,
          t: now,
        };
        headRef.current = (headRef.current + 1) % HEAT_CAP;
        if (sizeRef.current < HEAT_CAP) sizeRef.current++;
      });

    // Render Heatmap
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(3, 8, 16, 0.92)';
    ctx.fillRect(0, 0, W, H);

    const start = sizeRef.current < HEAT_CAP ? 0 : headRef.current;

    for (let i = 0; i < sizeRef.current; i++) {
      const pt = ringRef.current[(start + i) % HEAT_CAP];
      if (!pt) continue;

      const age = (now - pt.t) / 10000;
      if (age > 1) continue;

      const al = (1 - age) * 0.24;
      const r = 20 + (1 - age) * 10;

      const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
      grd.addColorStop(0, `rgba(248, 113, 113, ${al})`);
      grd.addColorStop(0.4, `rgba(245, 158, 11, ${al * 0.5})`);
      grd.addColorStop(1, 'transparent');

      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Coordinate grid overlay
    ctx.strokeStyle = 'rgba(56, 217, 245, 0.08)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += W / 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += H / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }, [targets]);

  return (
    <div className="panel heatmap-panel p-4 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Motion Heatmap Analytics
          </h3>
          <p className="text-[0.65rem] font-mono text-muted">
            Dwell zones · congestion · movement density
          </p>
        </div>
        <div className="font-mono text-[0.6rem] px-2.5 py-0.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan">
          LIVE
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={560}
        height={240}
        className="w-full rounded-xl border border-white/10 bg-[#030810]/90 aspect-[16/7] block"
      />
    </div>
  );
};
