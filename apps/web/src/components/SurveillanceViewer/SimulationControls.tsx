import React from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import { SimulationScenario } from '@sentinel/shared';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';

export const SimulationControls: React.FC = () => {
  const {
    simulationScenario,
    simulationSpeed,
    isSimulationPaused,
    setSimulationScenario,
    setSimulationSpeed,
    toggleSimulationPause,
    resetSimulation,
  } = useSurveillanceStore();

  const scenarios: { id: SimulationScenario; label: string; desc: string }[] = [
    { id: 'NORMAL_TRACK', label: 'Normal Patrol', desc: '3 entities patrolling within perimeter' },
    { id: 'OCCLUSION', label: 'Occlusion Test', desc: 'Target moves behind building with Kalman prediction' },
    { id: 'REACQUISITION', label: 'Reacquisition', desc: 'Target re-emerges from occlusion with track association' },
    { id: 'ANOMALOUS_MOVEMENT', label: 'Anomalous Shift', desc: 'Sudden velocity spike & erratic direction' },
    { id: 'MULTIPLE_TARGETS', label: 'Dense Cluster', desc: '6 targets in cross-trajectory paths' },
    { id: 'TARGET_LOST', label: 'Target Lost', desc: 'Entity exits perimeter exceeding prediction timeout' },
  ];

  const speeds = [0.5, 1.0, 1.5, 2.0, 3.0];

  return (
    <div className="mt-3 p-3 rounded-xl border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
      {/* Scenario Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[0.62rem] font-mono text-dim mr-1 uppercase">Scenario:</span>
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => setSimulationScenario(sc.id)}
            title={sc.desc}
            className={`font-mono text-[0.65rem] px-2.5 py-1 rounded-lg border transition-all ${
              simulationScenario === sc.id
                ? 'bg-cyan/20 border-cyan/40 text-cyan font-semibold shadow-sm'
                : 'bg-white/[0.03] border-white/10 text-muted hover:text-white hover:border-white/20'
            }`}
          >
            {sc.label}
          </button>
        ))}
      </div>

      {/* Playback Controls & Speed */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSimulationPause}
          className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-muted hover:text-white hover:border-white/30 transition-all"
          title={isSimulationPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {isSimulationPaused ? (
            <Play size={14} className="text-green" />
          ) : (
            <Pause size={14} className="text-amber" />
          )}
        </button>

        <button
          onClick={resetSimulation}
          className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-muted hover:text-white hover:border-white/30 transition-all"
          title="Reset Simulation Entities"
        >
          <RotateCcw size={14} />
        </button>

        <div className="flex items-center gap-1 pl-2 border-l border-white/10">
          <Zap size={12} className="text-cyan/70" />
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setSimulationSpeed(s)}
              className={`font-mono text-[0.6rem] px-1.5 py-0.5 rounded transition-all ${
                simulationSpeed === s
                  ? 'bg-cyan/30 text-cyan font-bold'
                  : 'text-dim hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
