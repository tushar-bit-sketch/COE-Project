import { create } from 'zustand';
import {
  AnomalyEventData,
  CameraSourceData,
  SimulationScenario,
  TacticalTelemetry,
  TargetData,
} from '@sentinel/shared';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';

export interface EventLogItem {
  id: string;
  text: string;
  tag: 'ok' | 'info' | 'warn' | 'danger';
  time: string;
}

interface SurveillanceState {
  telemetry: TacticalTelemetry | null;
  targets: TargetData[];
  lockedTargetId: number | null;
  selectedTargetId: number | null;
  activeAlarms: AnomalyEventData[];
  sources: CameraSourceData[];
  activeSource: CameraSourceData | null;
  simulationScenario: SimulationScenario;
  simulationSpeed: number;
  isSimulationPaused: boolean;
  isWsConnected: boolean;
  wsLatency: number;
  eventLogs: EventLogItem[];
  audioAlertsEnabled: boolean;
  selectedCamTab: string;

  // Actions
  setTelemetry: (telemetry: TacticalTelemetry) => void;
  setLock: (id: number | null) => Promise<void>;
  setSelectedTarget: (id: number | null) => void;
  setWsConnected: (connected: boolean) => void;
  setWsLatency: (latency: number) => void;
  setSource: (source: CameraSourceData) => void;
  setSources: (sources: CameraSourceData[]) => void;
  setSimulationScenario: (scenario: SimulationScenario) => Promise<void>;
  setSimulationSpeed: (speed: number) => Promise<void>;
  toggleSimulationPause: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  addEventLog: (text: string, tag?: 'ok' | 'info' | 'warn' | 'danger') => void;
  acknowledgeAlarm: (id: string) => Promise<void>;
  toggleAudioAlerts: () => void;
  setSelectedCamTab: (tab: string) => void;
}

export const useSurveillanceStore = create<SurveillanceState>((set, get) => ({
  telemetry: null,
  targets: [],
  lockedTargetId: null,
  selectedTargetId: null,
  activeAlarms: [],
  sources: [],
  activeSource: null,
  simulationScenario: 'NORMAL_TRACK',
  simulationSpeed: 1.0,
  isSimulationPaused: false,
  isWsConnected: false,
  wsLatency: 0,
  eventLogs: [
    {
      id: 'init-1',
      text: 'SENTINEL-X v5.0 initialized',
      tag: 'ok',
      time: new Date().toTimeString().slice(0, 8),
    },
    {
      id: 'init-2',
      text: 'Secure access layer: AUTHENTICATED [ALPHA-7]',
      tag: 'ok',
      time: new Date().toTimeString().slice(0, 8),
    },
    {
      id: 'init-3',
      text: 'Neural inference engine online — COCO-SSD / YOLO ready',
      tag: 'info',
      time: new Date().toTimeString().slice(0, 8),
    },
    {
      id: 'init-4',
      text: 'Kalman-6D state predictor armed',
      tag: 'ok',
      time: new Date().toTimeString().slice(0, 8),
    },
  ],
  audioAlertsEnabled: false,
  selectedCamTab: 'A',

  setTelemetry: (telemetry) => {
    const prevLocked = get().lockedTargetId;
    set({
      telemetry,
      targets: telemetry.targets,
      activeAlarms: telemetry.activeAlarms,
      lockedTargetId: telemetry.lockedTargetId,
      activeSource: telemetry.source,
    });

    // Check if new alarm appeared
    if (telemetry.activeAlarms.length > 0) {
      const top = telemetry.activeAlarms[0];
      const existing = get().eventLogs.find((l) => l.text.includes(top.targetLabel));
      if (!existing) {
        get().addEventLog(`THREAT — ${top.targetLabel} · ${top.type}`, 'danger');
      }
    }
  },

  setLock: async (id) => {
    set({ lockedTargetId: id });
    wsClient.send({ type: 'target:lock', targetId: id });

    try {
      if (id !== null) {
        await api.lockTarget(id);
        get().addEventLog(`Target lock acquired — TGT-${String(id).padStart(3, '0')}`, 'warn');
      } else {
        const prev = get().lockedTargetId;
        if (prev !== null) {
          await api.unlockTarget(prev);
        }
        get().addEventLog('Target lock released — wide-area scan resumed', 'info');
      }
    } catch {
      // Fallback handled via WS
    }
  },

  setSelectedTarget: (id) => set({ selectedTargetId: id }),
  setWsConnected: (connected) => set({ isWsConnected: connected }),
  setWsLatency: (wsLatency) => set({ wsLatency }),
  setSource: (activeSource) => set({ activeSource }),
  setSources: (sources) => set({ sources }),

  setSimulationScenario: async (scenario) => {
    set({ simulationScenario: scenario, lockedTargetId: null });
    wsClient.send({ type: 'simulation:control', action: 'SCENARIO', scenario });
    try {
      await api.updateSimulation({ scenario });
      get().addEventLog(`Simulation scenario set: ${scenario}`, 'info');
    } catch {
      // Handled
    }
  },

  setSimulationSpeed: async (speed) => {
    set({ simulationSpeed: speed });
    wsClient.send({ type: 'simulation:control', action: 'SPEED', speed });
    try {
      await api.updateSimulation({ speed });
    } catch {
      // Handled
    }
  },

  toggleSimulationPause: async () => {
    const nextState = !get().isSimulationPaused;
    set({ isSimulationPaused: nextState });
    wsClient.send({ type: 'simulation:control', action: 'TOGGLE_PAUSE' });
    try {
      await api.toggleSimulationPause();
    } catch {
      // Handled
    }
  },

  resetSimulation: async () => {
    set({ lockedTargetId: null });
    wsClient.send({ type: 'simulation:control', action: 'RESET' });
    try {
      await api.resetSimulation();
      get().addEventLog('Simulation reset to origin bounds', 'info');
    } catch {
      // Handled
    }
  },

  addEventLog: (text, tag = 'ok') => {
    const time = new Date().toTimeString().slice(0, 8);
    const item: EventLogItem = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      tag,
      time,
    };
    set((state) => ({
      eventLogs: [item, ...state.eventLogs.slice(0, 24)],
    }));
  },

  acknowledgeAlarm: async (id) => {
    try {
      await api.acknowledgeEvent(id);
      wsClient.send({ type: 'alarm:acknowledge', alertId: id });
      set((state) => ({
        activeAlarms: state.activeAlarms.filter((a) => a.id !== id),
      }));
      get().addEventLog(`Alert acknowledged by operator`, 'ok');
    } catch {
      // Handled
    }
  },

  toggleAudioAlerts: () => set((s) => ({ audioAlertsEnabled: !s.audioAlertsEnabled })),
  setSelectedCamTab: (tab) => {
    set({ selectedCamTab: tab });
    get().addEventLog(`Switched optical stream: CAM-${tab}`, 'info');
  },
}));
