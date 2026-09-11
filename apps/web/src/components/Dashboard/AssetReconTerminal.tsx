import React, { useEffect, useRef } from 'react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

export const AssetReconTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const { eventLogs } = useSurveillanceStore();

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [eventLogs]);

  return (
    <div className="panel console-panel p-4 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Asset Recon Terminal
          </h3>
          <p className="text-[0.65rem] font-mono text-muted">
            Intelligence feed · command relay
          </p>
        </div>
        <div className="font-mono text-[0.6rem] px-2 py-0.5 rounded-full bg-green/10 border border-green/30 text-green">
          TERM
        </div>
      </div>

      <div
        ref={terminalRef}
        className="h-[118px] overflow-y-auto rounded-lg border border-green/20 bg-[#02050a]/95 font-mono text-[0.62rem] text-green p-2.5 leading-relaxed tracking-wide space-y-1"
      >
        <div className="flex gap-1.5 opacity-60">
          <span className="text-cyan">›</span>
          <span>SENTINEL-X terminal ready</span>
        </div>
        <div className="flex gap-1.5 opacity-60">
          <span className="text-cyan">›</span>
          <span>Tactical telemetry stream online</span>
        </div>

        {eventLogs.slice(0, 20).reverse().map((log) => (
          <div
            key={log.id}
            className={`flex gap-1.5 ${
              log.tag === 'danger'
                ? 'text-red'
                : log.tag === 'warn'
                ? 'text-amber'
                : 'text-green'
            }`}
          >
            <span className="text-cyan flex-shrink-0">[{log.time}]</span>
            <span className="break-all">{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
