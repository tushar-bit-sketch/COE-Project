import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

export const AlarmBanner: React.FC = () => {
  const {
    activeAlarms,
    lockedTargetId,
    telemetry,
    acknowledgeAlarm,
    activeSource,
  } = useSurveillanceStore();

  const hasAlarm = activeAlarms.length > 0;
  const topAlarm = hasAlarm ? activeAlarms[0] : null;

  const anyOccluded = telemetry?.targets.some((t) => t.occluded);

  if (hasAlarm && topAlarm) {
    return (
      <div className="absolute left-4 top-10 flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-mono font-semibold border border-red/60 bg-[#5a0a14]/90 backdrop-blur-md text-red animate-alrtpulse z-20 shadow-lg">
        <AlertCircle size={14} className="text-red animate-pulse" />
        <span>
          ⚠ Threat — {topAlarm.targetLabel} · {topAlarm.type}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            acknowledgeAlarm(topAlarm.id);
          }}
          className="ml-1 text-[0.62rem] px-2 py-0.5 rounded bg-red/20 hover:bg-red/40 border border-red/40 text-white font-mono uppercase tracking-wider transition-colors flex items-center gap-1"
        >
          <CheckCircle size={10} />
          <span>Acknowledge</span>
        </button>
      </div>
    );
  }

  if (lockedTargetId !== null) {
    return (
      <div className="absolute left-4 top-10 px-4 py-1.5 rounded-full text-xs font-mono font-semibold border border-white/10 bg-[#030810]/80 backdrop-blur-md text-cyan z-20">
        🔒 Locked-on TGT-{String(lockedTargetId).padStart(3, '0')} · tracking
      </div>
    );
  }

  if (anyOccluded) {
    return (
      <div className="absolute left-4 top-10 px-4 py-1.5 rounded-full text-xs font-mono font-semibold border border-amber/30 bg-[#3c2805]/80 backdrop-blur-md text-amber z-20">
        ⚡ Occlusion · Kalman prediction active
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-10 px-4 py-1.5 rounded-full text-xs font-mono font-medium border border-white/10 bg-[#030810]/70 backdrop-blur-md text-muted z-20">
      {activeSource?.type === 'SIMULATION' ? 'Simulation active' : 'Live AI detection active'}
    </div>
  );
};
