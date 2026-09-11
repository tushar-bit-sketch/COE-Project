import React, { useEffect, useRef } from 'react';

export const TacticalSignalMatrix: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let csiPhase = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(3, 5, 16, 0.92)';
      ctx.fillRect(0, 0, W, H);

      const bands = 6;
      for (let b = 0; b < bands; b++) {
        const col = b % 2 === 0 ? 'rgba(167, 139, 250,' : 'rgba(56, 217, 245,';
        ctx.strokeStyle = col + (0.35 + Math.sin(csiPhase * 0.7 + b) * 0.15) + ')';
        ctx.lineWidth = 1.2;
        ctx.beginPath();

        for (let x = 0; x < W; x += 2) {
          const freq = 0.04 + b * 0.012;
          const y =
            H / 2 +
            Math.sin(x * freq + csiPhase + b * 1.1) * (14 - b * 1.5) +
            Math.cos(x * freq * 0.5 + csiPhase * 1.3) * (6 - b);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Frequency tick marks
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.12)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += W / 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      csiPhase += 0.04;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="panel csi-panel p-4 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Tactical Signal Matrix
          </h3>
          <p className="text-[0.65rem] font-mono text-muted">
            Spectral intercept · waveform analysis
          </p>
        </div>
        <div className="font-mono text-[0.6rem] px-2 py-0.5 rounded-full bg-violet/10 border border-violet/20 text-violet">
          CSI
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={280}
        height={108}
        className="w-full h-[108px] rounded-lg border border-violet/20 bg-[#030510]/90 block"
      />
    </div>
  );
};
