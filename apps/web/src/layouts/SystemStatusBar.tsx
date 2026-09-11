import React from 'react';
import { useSurveillanceStore } from '../stores/useSurveillanceStore.js';

export const SystemStatusBar: React.FC = () => {
  const { telemetry, lockedTargetId, activeAlarms } = useSurveillanceStore();

  const leadTarget =
    lockedTargetId !== null
      ? telemetry?.targets.find((t) => t.id === lockedTargetId)
      : telemetry?.targets[0];

  const posText = leadTarget
    ? `X:${leadTarget.box.cx.toFixed(0)} Y:${leadTarget.box.cy.toFixed(0)}`
    : '—';

  const velText = leadTarget
    ? `Vx:${leadTarget.vx.toFixed(2)} Vy:${leadTarget.vy.toFixed(2)}`
    : 'Vx:0 Vy:0';

  const latText = telemetry?.pipeline.totalMs ? `${telemetry.pipeline.totalMs} ms` : '— ms';

  const alarmText =
    activeAlarms.length > 0
      ? `⚠ THREAT DETECTED (${activeAlarms[0].type})`
      : lockedTargetId !== null
      ? `🔒 TGT-${String(lockedTargetId).padStart(3, '0')} LOCKED`
      : 'Alarm idle';

  const isAlarmActive = activeAlarms.length > 0;

  return (
    <div className="status-bar grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
      <div className="panel sb-pill p-3 sm:p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <strong className="block font-mono text-sm sm:text-base text-white font-semibold">
          Frame {telemetry?.frame || 0}
        </strong>
        <span className="text-[0.65rem] text-dim font-mono tracking-wide">
          Sequential frame index
        </span>
      </div>

      <div className="panel sb-pill p-3 sm:p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <strong className="block font-mono text-sm sm:text-base text-cyan font-semibold">
          {posText}
        </strong>
        <span className="text-[0.65rem] text-dim font-mono tracking-wide">
          Lead target centroid
        </span>
      </div>

      <div className="panel sb-pill p-3 sm:p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <strong className="block font-mono text-sm sm:text-base text-white font-semibold">
          {velText}
        </strong>
        <span className="text-[0.65rem] text-dim font-mono tracking-wide">
          Motion model velocity
        </span>
      </div>

      <div className="panel sb-pill p-3 sm:p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <strong className="block font-mono text-sm sm:text-base text-cyan font-semibold">
          {latText}
        </strong>
        <span className="text-[0.65rem] text-dim font-mono tracking-wide">
          End-to-end inference
        </span>
      </div>

      <div
        className={`panel sb-pill p-3 sm:p-4 rounded-xl border ${
          isAlarmActive
            ? 'border-red/40 bg-red/10 text-red animate-pulse'
            : 'border-white/10 bg-white/[0.02]'
        }`}
      >
        <strong
          className={`block font-mono text-sm sm:text-base font-semibold ${
            isAlarmActive ? 'text-red' : 'text-muted'
          }`}
        >
          {alarmText}
        </strong>
        <span className="text-[0.65rem] text-dim font-mono tracking-wide">
          Threat response layer
        </span>
      </div>
    </div>
  );
};
