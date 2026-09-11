import React, { useEffect, useRef } from 'react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

export const RadarPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { targets, lockedTargetId } = useSurveillanceStore();

  useEffect(() => {
    let animId: number;
    let radarAngle = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const S = canvas.width;
      const cx = S / 2;
      const cy = S / 2;
      const R = S / 2 - 8;

      ctx.clearRect(0, 0, S, S);

      // Radar base
      ctx.fillStyle = 'rgba(2, 8, 16, 0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Range circles
      [0.33, 0.66, 1].forEach((f) => {
        ctx.strokeStyle = 'rgba(56, 217, 245, 0.12)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.strokeStyle = 'rgba(56, 217, 245, 0.12)';
      ctx.lineWidth = 0.5;
      [-1, 1].forEach((s) => {
        ctx.beginPath();
        ctx.moveTo(cx + R * s, cy);
        ctx.lineTo(cx - R * s, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy + R * s);
        ctx.lineTo(cx, cy - R * s);
        ctx.stroke();
      });

      // Rotating sweep beam
      radarAngle = (radarAngle + 0.025) % (Math.PI * 2);
      const sweepLen = Math.PI / 2.8;

      for (let a = radarAngle - sweepLen; a < radarAngle; a += 0.04) {
        const t = (a - (radarAngle - sweepLen)) / sweepLen;
        ctx.strokeStyle = `rgba(56, 217, 245, ${t * 0.35})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }

      // Sweep leading ray
      ctx.strokeStyle = 'rgba(56, 217, 245, 0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(radarAngle) * R, cy + Math.sin(radarAngle) * R);
      ctx.stroke();

      // Target blips mapped from 960x540 viewport into radar circle
      const scW = 960;
      const scH = 540;

      targets
        .filter((t) => t.state !== 'LOST')
        .forEach((t) => {
          const nx = (t.box.cx / scW) * 2 - 1;
          const ny = (t.box.cy / scH) * 2 - 1;
          const bx = cx + nx * R * 0.85;
          const by = cy + ny * R * 0.85;

          const isLocked = lockedTargetId !== null && t.id === lockedTargetId;
          const isDimmed = lockedTargetId !== null && t.id !== lockedTargetId;

          const blipColor = isLocked
            ? '#f87171'
            : t.threatLevel === 'CRITICAL'
            ? '#a78bfa'
            : t.threatLevel === 'HIGH'
            ? '#f87171'
            : t.threatLevel === 'MEDIUM'
            ? '#f59e0b'
            : '#34d399';

          ctx.globalAlpha = isDimmed ? 0.2 : 1;
          ctx.fillStyle = blipColor;
          ctx.shadowColor = blipColor;
          ctx.shadowBlur = isLocked ? 14 : 8;

          ctx.beginPath();
          ctx.arc(bx, by, isLocked ? 6 : t.anomaly ? 4.5 : 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        });

      // Outer bezel ring
      ctx.strokeStyle = 'rgba(56, 217, 245, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [targets, lockedTargetId]);

  return (
    <div className="panel minimap-panel p-4 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Tactical Radar
          </h3>
          <p className="text-[0.65rem] font-mono text-muted">
            Position · velocity · threat blips
          </p>
        </div>
        <div className="font-mono text-[0.6rem] px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan">
          SWEEP
        </div>
      </div>

      <div className="flex justify-center p-2">
        <canvas
          ref={canvasRef}
          width={220}
          height={220}
          className="rounded-full border border-cyan/20 bg-[#030810] block"
        />
      </div>
    </div>
  );
};
