import React from 'react';
import { Crosshair, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { VideoStage } from '../components/SurveillanceViewer/VideoStage.js';
import { RadarPanel } from '../components/Dashboard/RadarPanel.js';
import { KalmanVelocityPanel } from '../components/Dashboard/KalmanVelocityPanel.js';
import { useSurveillanceStore } from '../stores/useSurveillanceStore.js';

export const MonitorPage: React.FC = () => {
  const { targets, lockedTargetId, setLock, selectedTargetId, setSelectedTarget } =
    useSurveillanceStore();

  const focusedTarget =
    lockedTargetId !== null
      ? targets.find((t) => t.id === lockedTargetId)
      : selectedTargetId !== null
      ? targets.find((t) => t.id === selectedTargetId)
      : targets[0];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <Crosshair size={18} className="text-cyan" />
          <div>
            <h2 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Tactical Surveillance Monitor
            </h2>
            <p className="text-[0.65rem] font-mono text-muted">
              Focused wide-angle optical stream with active target tracking telemetry
            </p>
          </div>
        </div>
        <div className="font-mono text-xs px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan">
          WIDE SCAN
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Expanded Video Stage */}
        <div className="space-y-4">
          <VideoStage />
          <KalmanVelocityPanel />
        </div>

        {/* Tactical Telemetry & Target Inspector */}
        <div className="space-y-4">
          <div className="panel p-4 border border-white/10 bg-black/40">
            <h3 className="font-display text-sm font-bold text-white mb-1">
              Target Telemetry Inspector
            </h3>
            <p className="text-[0.65rem] font-mono text-muted mb-4">
              Detailed kinematic & state breakdown
            </p>

            {focusedTarget ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                  <span className="text-muted">Target ID</span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: focusedTarget.col }}
                  >
                    {focusedTarget.label}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                  <span className="text-muted">State</span>
                  <span
                    className={`font-semibold ${
                      focusedTarget.isLocked
                        ? 'text-red'
                        : focusedTarget.occluded
                        ? 'text-amber'
                        : 'text-green'
                    }`}
                  >
                    {focusedTarget.state}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                    <span className="text-dim text-[0.6rem] block">Centroid</span>
                    <span className="text-white">
                      X:{focusedTarget.box.cx.toFixed(0)} Y:{focusedTarget.box.cy.toFixed(0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                    <span className="text-dim text-[0.6rem] block">Dimensions</span>
                    <span className="text-white">
                      {focusedTarget.box.w.toFixed(0)}×{focusedTarget.box.h.toFixed(0)} px
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                    <span className="text-dim text-[0.6rem] block">Velocity</span>
                    <span className="text-cyan">
                      Vx:{focusedTarget.vx.toFixed(2)} Vy:{focusedTarget.vy.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                    <span className="text-dim text-[0.6rem] block">Kinetic Speed</span>
                    <span className="text-cyan">{focusedTarget.speed.toFixed(2)} px/f</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                    <span className="text-dim text-[0.6rem] block">Confidence</span>
                    <span className="text-green">
                      {(focusedTarget.conf * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
                    <span className="text-dim text-[0.6rem] block">Dwell Time</span>
                    <span className="text-white">{focusedTarget.dwellTime} frames</span>
                  </div>
                </div>

                {/* Lock Action Button */}
                <button
                  onClick={() =>
                    setLock(lockedTargetId === focusedTarget.id ? null : focusedTarget.id)
                  }
                  className={`w-full py-2.5 rounded-xl border font-mono text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    lockedTargetId === focusedTarget.id
                      ? 'bg-red/20 border-red/50 text-red hover:bg-red/30'
                      : 'bg-cyan/15 border-cyan/40 text-cyan hover:bg-cyan/25'
                  }`}
                >
                  {lockedTargetId === focusedTarget.id ? (
                    <>
                      <Unlock size={14} />
                      <span>Release Target Lock</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Acquire Tactical Lock</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-10 font-mono text-xs text-dim">
                No active target selected
              </div>
            )}
          </div>

          <RadarPanel />
        </div>
      </div>
    </div>
  );
};
