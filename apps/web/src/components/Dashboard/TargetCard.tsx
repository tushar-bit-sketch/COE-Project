import React from 'react';
import { TargetData } from '@sentinel/shared';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

interface TargetCardProps {
  target: TargetData;
}

export const TargetCard: React.FC<TargetCardProps> = ({ target }) => {
  const { lockedTargetId, setLock } = useSurveillanceStore();

  const isLocked = lockedTargetId === target.id;
  const isDimmed = lockedTargetId !== null && !isLocked;

  const threatColor =
    target.threatLevel === 'CRITICAL'
      ? '#a78bfa'
      : target.threatLevel === 'HIGH'
      ? '#f87171'
      : target.threatLevel === 'MEDIUM'
      ? '#f59e0b'
      : '#34d399';

  const statusLabel = isLocked
    ? 'LOCKED-ON'
    : target.state === 'LOST'
    ? 'LOST'
    : target.anomaly
    ? target.behavior || 'ANOMALY'
    : target.occluded
    ? 'OCCLUDED'
    : target.behavior || 'NORMAL';

  const statusTagClass = isLocked
    ? 'bg-red/20 text-red border border-red/50 animate-pulse'
    : target.state === 'LOST'
    ? 'bg-white/5 text-dim border border-white/10'
    : target.anomaly
    ? 'bg-red/10 text-red border border-red/40 animate-pulse'
    : target.occluded
    ? 'bg-amber/10 text-amber border border-amber/30'
    : 'bg-green/10 text-green border border-green/30';

  return (
    <div
      onClick={() => setLock(isLocked ? null : target.id)}
      style={{
        borderLeftColor: isLocked ? '#f87171' : target.col,
        opacity: isDimmed ? 0.35 : 1,
      }}
      className={`p-3 rounded-xl border border-white/10 border-l-[3px] transition-all cursor-pointer select-none ${
        isLocked
          ? 'bg-red/[0.08] shadow-[0_0_16px_rgba(248,113,113,0.15)] border-red/40'
          : target.anomaly
          ? 'bg-[#500514]/20 border-red/30'
          : target.occluded
          ? 'bg-[#3c2805]/20 border-amber/30'
          : 'bg-white/[0.03] hover:bg-white/[0.06] hover:translate-x-1'
      }`}
    >
      {/* Top row: ID and Status tag */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isLocked ? '#f87171' : target.col,
              boxShadow: `0 0 6px ${isLocked ? '#f87171' : target.col}`,
            }}
          />
          <span
            className="font-display font-bold text-xs"
            style={{ color: isLocked ? '#f87171' : target.col }}
          >
            {target.label}
          </span>
        </div>
        <div
          className={`font-mono text-[0.55rem] px-2 py-0.5 rounded font-semibold tracking-wider ${statusTagClass}`}
        >
          {statusLabel}
        </div>
      </div>

      {/* Meta row */}
      <div className="font-mono text-[0.6rem] text-dim flex gap-3 flex-wrap mb-2">
        <span>CONF {(target.conf * 100).toFixed(0)}%</span>
        <span>SPD {target.speed.toFixed(1)}</span>
        <span>AGE {target.age}f</span>
        <span>DWL {target.dwellTime}f</span>
      </div>

      {/* Threat Row */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="font-mono text-[0.55rem] text-dim uppercase tracking-wider">
          Threat
        </span>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden mx-1">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${target.threatScore || 10}%`,
              backgroundColor: threatColor,
            }}
          />
        </div>
        <span
          className="font-mono text-[0.58rem] font-semibold min-w-[38px] text-right"
          style={{ color: threatColor }}
        >
          {target.threatLevel || 'LOW'}
        </span>
      </div>
    </div>
  );
};

export const TargetList: React.FC = () => {
  const { targets } = useSurveillanceStore();
  const activeTargets = targets.filter((t) => t.state !== 'LOST');

  return (
    <div className="panel targets-panel p-4 border border-white/10 bg-black/40 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-sm font-bold text-white tracking-tight">
            Active Targets
          </h3>
          <p className="text-[0.65rem] font-mono text-muted">Click to lock acquisition</p>
        </div>
        <div className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-green/10 border border-green/25 text-green">
          {activeTargets.length}
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1">
        {activeTargets.length === 0 ? (
          <div className="text-center py-8 font-mono text-xs text-dim">
            NO ACTIVE TARGETS IN SECTOR
          </div>
        ) : (
          activeTargets.map((target) => <TargetCard key={target.id} target={target} />)
        )}
      </div>
    </div>
  );
};
