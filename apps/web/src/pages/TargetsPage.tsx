import React, { useState } from 'react';
import { Lock, Unlock, Eye, Radio, Search } from 'lucide-react';
import { TargetData } from '@sentinel/shared';
import { useSurveillanceStore } from '../stores/useSurveillanceStore.js';

export const TargetsPage: React.FC = () => {
  const { targets, lockedTargetId, setLock } = useSurveillanceStore();
  const [filterState, setFilterState] = useState<string>('ALL');
  const [selectedTarget, setSelectedTarget] = useState<TargetData | null>(null);

  const filteredTargets = targets.filter((t: TargetData) => {
    if (filterState === 'ALL') return true;
    if (filterState === 'LOCKED') return lockedTargetId === t.id;
    if (filterState === 'ANOMALY') return t.anomaly;
    if (filterState === 'OCCLUDED') return t.occluded;
    return t.state === filterState;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Radio size={20} className="text-cyan" />
          <div>
            <h2 className="font-display font-bold text-base text-white tracking-tight">
              Target Intelligence Registry
            </h2>
            <p className="text-xs font-mono text-muted">
              Live tracking states · state estimation · target locking
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'TRACKING', 'LOCKED', 'OCCLUDED', 'ANOMALY'].map((state) => (
            <button
              key={state}
              onClick={() => setFilterState(state)}
              className={`font-mono text-xs px-3 py-1 rounded-lg border transition-all ${
                filterState === state
                  ? 'bg-cyan/20 border-cyan/40 text-cyan font-bold'
                  : 'bg-white/[0.03] border-white/10 text-muted hover:text-white'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Target Registry Table */}
      <div className="panel p-4 border border-white/10 bg-black/40 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-white/10 text-dim text-[0.65rem] uppercase tracking-wider">
              <th className="pb-3 pl-2">Target</th>
              <th className="pb-3">State</th>
              <th className="pb-3">Confidence</th>
              <th className="pb-3">Position</th>
              <th className="pb-3">Velocity</th>
              <th className="pb-3">Speed</th>
              <th className="pb-3">Threat</th>
              <th className="pb-3">Lock Status</th>
              <th className="pb-3 pr-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredTargets.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-dim">
                  NO TARGETS MATCHING CRITERIA
                </td>
              </tr>
            ) : (
              filteredTargets.map((t) => {
                const isLocked = lockedTargetId === t.id;
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      isLocked ? 'bg-red/[0.06]' : ''
                    }`}
                  >
                    <td className="py-3 pl-2 flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isLocked ? '#f87171' : t.col }}
                      />
                      <span className="font-bold text-white">{t.label}</span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[0.6rem] font-semibold ${
                          isLocked
                            ? 'bg-red/20 text-red border border-red/40'
                            : t.occluded
                            ? 'bg-amber/20 text-amber'
                            : t.anomaly
                            ? 'bg-red/20 text-red'
                            : 'bg-green/20 text-green'
                        }`}
                      >
                        {isLocked ? 'LOCKED' : t.state}
                      </span>
                    </td>
                    <td className="py-3 text-cyan">{(t.conf * 100).toFixed(0)}%</td>
                    <td className="py-3 text-muted">
                      {t.box.cx.toFixed(0)}, {t.box.cy.toFixed(0)}
                    </td>
                    <td className="py-3 text-dim">
                      {t.vx.toFixed(1)}, {t.vy.toFixed(1)}
                    </td>
                    <td className="py-3 text-white">{t.speed.toFixed(1)} px/f</td>
                    <td className="py-3">
                      <span
                        className="font-bold text-[0.65rem]"
                        style={{
                          color:
                            t.threatLevel === 'CRITICAL'
                              ? '#a78bfa'
                              : t.threatLevel === 'HIGH'
                              ? '#f87171'
                              : t.threatLevel === 'MEDIUM'
                              ? '#f59e0b'
                              : '#34d399',
                        }}
                      >
                        {t.threatLevel} ({t.threatScore})
                      </span>
                    </td>
                    <td className="py-3">
                      {isLocked ? (
                        <span className="text-red font-bold flex items-center gap-1">
                          <Lock size={12} />
                          LOCKED
                        </span>
                      ) : (
                        <span className="text-dim">UNLOCKED</span>
                      )}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTarget(t)}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-cyan/40 text-muted hover:text-cyan transition-colors"
                          title="Inspect Target Trajectory"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => setLock(isLocked ? null : t.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isLocked
                              ? 'border-red/40 bg-red/20 text-red hover:bg-red/30'
                              : 'border-white/10 hover:border-cyan/40 text-muted hover:text-cyan'
                          }`}
                          title={isLocked ? 'Release Lock' : 'Acquire Lock'}
                        >
                          {isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Target Inspector Detail Modal */}
      {selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-6 rounded-2xl border border-cyan/30 bg-[#030810]/95 shadow-2xl">
            <h3 className="font-display font-bold text-base text-white mb-2">
              Kinematic Inspector · {selectedTarget.label}
            </h3>
            <p className="font-mono text-xs text-muted mb-4">
              Trajectory observations and state estimation
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex justify-between">
                <span className="text-dim">First Detected</span>
                <span className="text-white">{selectedTarget.firstDetectedAt}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex justify-between">
                <span className="text-dim">Last Observation</span>
                <span className="text-white">{selectedTarget.lastDetectedAt}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex justify-between">
                <span className="text-dim">Trail History Length</span>
                <span className="text-cyan">{selectedTarget.trail.length} points</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 flex justify-between">
                <span className="text-dim">Covariance Trace (Uncertainty)</span>
                <span className="text-amber">
                  {selectedTarget.covarianceTrace?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTarget(null)}
                className="font-mono text-xs px-4 py-2 rounded-lg border border-white/20 text-muted hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
