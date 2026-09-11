import React from 'react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

export const SystemHealthPanel: React.FC = () => {
  const { telemetry, targets, lockedTargetId, activeSource } = useSurveillanceStore();

  const activeCount = targets.filter((t) => t.state !== 'LOST').length;
  const anyOccluded = targets.some((t) => t.occluded);
  const anyAnomaly = targets.some((t) => t.anomaly);
  const isSimulation = !activeSource || activeSource.type === 'SIMULATION';

  const avgConfidence = telemetry?.avgConfidence ?? 0.88;
  const avgAnomaly = telemetry?.avgAnomalyScore ?? 0.0;

  const predState = anyOccluded ? 'Predicting' : 'Visible';

  const healthScore = anyAnomaly ? 97 : anyOccluded ? 92 : 88;

  return (
    <div className="panel metrics-panel p-4 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Live Metrics
          </h3>
          <p className="text-[0.65rem] font-mono text-muted">
            Confidence · anomaly · status
          </p>
        </div>
      </div>

      {/* 2x2 Stat Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="font-mono text-[0.6rem] text-dim uppercase tracking-wider mb-1">
            Avg Confidence
          </div>
          <div className="font-display text-xl font-bold text-cyan">
            {avgConfidence.toFixed(2)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="font-mono text-[0.6rem] text-dim uppercase tracking-wider mb-1">
            Active Targets
          </div>
          <div className="font-display text-xl font-bold text-green">
            {activeCount}
            {lockedTargetId !== null && (
              <span className="text-[0.65rem] font-mono text-red ml-1">
                (🔒 #{lockedTargetId})
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="font-mono text-[0.6rem] text-dim uppercase tracking-wider mb-1">
            Anomaly Score
          </div>
          <div
            className={`font-display text-xl font-bold ${
              anyAnomaly ? 'text-red' : anyOccluded ? 'text-amber' : 'text-green'
            }`}
          >
            {avgAnomaly.toFixed(2)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="font-mono text-[0.6rem] text-dim uppercase tracking-wider mb-1">
            Pred State
          </div>
          <div
            className={`font-display text-base font-bold ${
              anyOccluded ? 'text-amber' : 'text-muted'
            }`}
          >
            {predState}
          </div>
        </div>
      </div>

      {/* Module Health Rows */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center text-[0.65rem] font-mono text-dim mb-1.5 uppercase">
          <span>Module Health</span>
          <span className="text-green font-semibold">{healthScore}%</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green to-cyan transition-all duration-500"
            style={{ width: `${healthScore}%` }}
          />
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isSimulation
                    ? 'bg-green shadow-[0_0_6px_#34d399]'
                    : 'bg-cyan shadow-[0_0_6px_#38d9f5]'
                }`}
              />
              <span className="text-muted text-xs">Detector stream</span>
            </div>
            <span className="text-dim text-[0.65rem] uppercase">
              {isSimulation ? 'ACTIVE' : 'LIVE'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green shadow-[0_0_6px_#34d399]" />
              <span className="text-muted text-xs">IoU identity lock</span>
            </div>
            <span className="text-dim text-[0.65rem] uppercase">LOCKED</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  anyOccluded ? 'bg-amber shadow-[0_0_6px_#f59e0b]' : 'bg-green'
                }`}
              />
              <span className="text-muted text-xs">Kalman predictor</span>
            </div>
            <span className="text-dim text-[0.65rem] uppercase">
              {anyOccluded ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  anyAnomaly ? 'bg-red shadow-[0_0_6px_#f87171]' : 'bg-green'
                }`}
              />
              <span className="text-muted text-xs">Threat classifier</span>
            </div>
            <span className="text-dim text-[0.65rem] uppercase">
              {anyAnomaly ? 'ALERT' : 'NORMAL'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
