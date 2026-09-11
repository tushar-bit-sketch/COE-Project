import React from 'react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

export const ProcessingPipeline: React.FC = () => {
  const { telemetry } = useSurveillanceStore();

  const pipeline = telemetry?.pipeline || {
    detectionMs: 14.5,
    trackingMs: 2.2,
    kalmanMs: 1.1,
    anomalyMs: 0.9,
    totalMs: 18.7,
  };

  const rows = [
    {
      icon: '🎯',
      name: 'COCO-SSD / YOLOv8 Detection',
      val: pipeline.detectionMs,
      color: 'bg-cyan',
      dimBg: 'bg-cyan/10',
      pct: Math.min(100, (pipeline.detectionMs / 60) * 100),
    },
    {
      icon: '🔗',
      name: 'IoU / DeepSORT Tracking',
      val: pipeline.trackingMs,
      color: 'bg-green',
      dimBg: 'bg-green/10',
      pct: Math.min(100, (pipeline.trackingMs / 20) * 100),
    },
    {
      icon: '📈',
      name: 'Kalman Prediction Engine',
      val: pipeline.kalmanMs,
      color: 'bg-amber',
      dimBg: 'bg-amber/10',
      pct: Math.min(100, (pipeline.kalmanMs / 15) * 100),
    },
    {
      icon: '⚡',
      name: 'Threat / Anomaly Classifier',
      val: pipeline.anomalyMs,
      color: 'bg-red',
      dimBg: 'bg-red/10',
      pct: Math.min(100, (pipeline.anomalyMs / 15) * 100),
    },
  ];

  return (
    <div className="panel pipeline-panel p-4 sm:p-5 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Processing Pipeline
          </h3>
          <p className="text-[0.65rem] font-mono text-muted">
            Per-frame module inference latency
          </p>
        </div>
        <div className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan">
          {pipeline.totalMs.toFixed(1)} ms
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {rows.map((r) => (
          <div key={r.name} className="py-2 flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-lg ${r.dimBg} flex items-center justify-center text-xs flex-shrink-0`}
            >
              {r.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-white/90 truncate mr-2">
                  {r.name}
                </span>
                <span className="font-mono text-[0.65rem] text-muted whitespace-nowrap">
                  {r.val.toFixed(1)} ms
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${r.color}`}
                  style={{ width: `${Math.max(5, r.pct)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
