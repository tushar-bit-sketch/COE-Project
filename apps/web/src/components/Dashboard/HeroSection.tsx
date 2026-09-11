import React, { useState } from 'react';
import { useSurveillanceStore } from '../../stores/useSurveillanceStore.js';
import { wsClient } from '../../services/websocket.js';

export const HeroSection: React.FC = () => {
  const {
    telemetry,
    activeSource,
    targets,
    isWsConnected,
    wsLatency,
    addEventLog,
  } = useSurveillanceStore();

  const [wsUrlInput, setWsUrlInput] = useState('ws://localhost:8765');
  const [isConnectingWs, setIsConnectingWs] = useState(false);

  const activeCount = targets.filter((t) => !t.missedFrames).length;
  const anyOccluded = targets.some((t) => t.occluded);
  const anyAnomaly = targets.some((t) => t.anomaly);
  const isSimulation = !activeSource || activeSource.type === 'SIMULATION';

  const handleConnectPythonWs = () => {
    setIsConnectingWs(true);
    addEventLog(`Attempting Python backend uplink to ${wsUrlInput}...`, 'info');
    try {
      wsClient.connect(wsUrlInput);
      setTimeout(() => {
        setIsConnectingWs(false);
      }, 1000);
    } catch {
      setIsConnectingWs(false);
    }
  };

  const chips = [
    'TensorFlow.js COCO-SSD',
    'Click-to-Lock Acquisition',
    'MJPEG IP Camera',
    'Secure Access Layer',
    'IoU + Kalman Tracking',
    'Behavioral Anomaly Engine',
    'Python WS Override',
  ];

  return (
    <div className="panel hero-panel p-6 sm:p-7 mb-4 border border-white/10 bg-black/40 backdrop-blur-xl grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
      <div>
        <div className="font-mono text-xs text-cyan tracking-widest uppercase mb-2">
          Integrated Surveillance Intelligence · Real-time AI Tracking · v5.0
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-cyan/80 mb-3">
          Never lose a human target.
        </h1>
        <p className="text-sm text-muted max-w-3xl leading-relaxed">
          In-browser person detection via TensorFlow.js COCO-SSD with IoU tracking, 6-state Kalman
          filtering, behavioral anomaly classification, click-to-lock target acquisition, and
          multi-source IP camera support.
        </p>

        {/* Feature Chips */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {chips.map((c) => (
            <span
              key={c}
              className="font-mono text-[0.65rem] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-muted hover:text-white hover:border-white/25 transition-all"
            >
              {c}
            </span>
          ))}
        </div>

        {/* WebSocket Uplink Row */}
        <div className="flex items-center gap-2.5 flex-wrap mt-4">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isWsConnected ? 'bg-green shadow-[0_0_8px_#34d399]' : 'bg-red/70'
            }`}
          />
          <input
            type="text"
            value={wsUrlInput}
            onChange={(e) => setWsUrlInput(e.target.value)}
            className="font-mono text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-white w-48 focus:outline-none focus:border-cyan"
            placeholder="ws://localhost:8765"
          />
          <button
            onClick={handleConnectPythonWs}
            disabled={isConnectingWs}
            className="font-sans text-xs font-semibold px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] transition-all"
          >
            {isConnectingWs ? 'Connecting...' : 'Connect WS'}
          </button>
          <span className="font-mono text-[0.65rem] text-dim">
            {isWsConnected
              ? `Uplink Active (${wsLatency || 1}ms)`
              : 'Local server uplink standby'}
          </span>
        </div>
      </div>

      {/* Right Telemetry Summary */}
      <div className="flex flex-col items-start lg:items-end gap-3 text-left lg:text-right">
        <div className="font-display text-base font-bold text-cyan tracking-wider">
          {isSimulation ? 'SIMULATION' : 'OPTICAL FEED'}
        </div>
        <div className="font-mono text-xs text-muted max-w-[220px] leading-relaxed">
          {isSimulation
            ? `Browser simulation · ${activeCount} tracked entities`
            : `${activeSource?.name || 'Active Optical Stream'}`}
        </div>

        {/* Subsystem State Dots */}
        <div className="flex gap-2 flex-wrap justify-start lg:justify-end">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green shadow-[0_0_6px_#34d399]" />
            <span className="font-mono text-[0.62rem] text-muted uppercase">
              Det: {isSimulation ? 'ACTIVE' : 'LIVE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green shadow-[0_0_6px_#34d399]" />
            <span className="font-mono text-[0.62rem] text-muted uppercase">IoU: LOCKED</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10">
            <div
              className={`w-2 h-2 rounded-full ${
                anyOccluded ? 'bg-amber shadow-[0_0_6px_#f59e0b]' : 'bg-green'
              }`}
            />
            <span className="font-mono text-[0.62rem] text-muted uppercase">
              Kal: {anyOccluded ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10">
            <div
              className={`w-2 h-2 rounded-full ${
                anyAnomaly ? 'bg-red shadow-[0_0_6px_#f87171]' : 'bg-green'
              }`}
            />
            <span className="font-mono text-[0.62rem] text-muted uppercase">
              Alarm: {anyAnomaly ? 'ALERT' : 'NORMAL'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
