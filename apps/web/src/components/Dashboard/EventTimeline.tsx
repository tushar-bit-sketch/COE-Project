import React from 'react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

export const EventTimeline: React.FC = () => {
  const { eventLogs } = useSurveillanceStore();

  return (
    <div className="panel timeline-panel p-4 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Event Timeline
          </h3>
          <p className="text-[0.65rem] font-mono text-muted">Rolling intelligence log</p>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
        {eventLogs.slice(0, 15).map((log) => {
          const dotColor =
            log.tag === 'danger'
              ? 'bg-red shadow-[0_0_6px_#f87171]'
              : log.tag === 'warn'
              ? 'bg-amber shadow-[0_0_6px_#f59e0b]'
              : log.tag === 'info'
              ? 'bg-cyan shadow-[0_0_6px_#38d9f5]'
              : 'bg-green shadow-[0_0_6px_#34d399]';

          return (
            <div
              key={log.id}
              className="p-2 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs font-sans"
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
              <div className="flex-1 min-w-0 text-white/90 text-xs leading-tight">
                {log.text}
              </div>
              <div className="font-mono text-[0.6rem] text-dim whitespace-nowrap">
                {log.time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
