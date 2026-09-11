import React, { useEffect, useState } from 'react';
import { TopNavigation } from './TopNavigation.js';
import { SystemStatusBar } from './SystemStatusBar.js';
import { SourceManagerModal } from '../components/SurveillanceViewer/SourceManagerModal.js';
import { PythonBridgeModal } from '../components/SurveillanceViewer/PythonBridgeModal.js';
import { useSurveillanceStore } from '../stores/useSurveillanceStore.js';
import { wsClient } from '../services/websocket.js';
import { api } from '../services/api.js';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);

  const {
    setTelemetry,
    setWsConnected,
    setWsLatency,
    setSources,
    addEventLog,
  } = useSurveillanceStore();

  useEffect(() => {
    // 1. Initial REST fetch for sources
    api
      .getSources()
      .then(({ sources }) => setSources(sources))
      .catch((err) => console.warn('Initial sources fetch error:', err));

    // 2. Connect WebSocket
    wsClient.connect();

    const unsubConnection = wsClient.on('connection', ({ connected }) => {
      setWsConnected(connected);
      if (connected) {
        addEventLog('Real-time WebSocket telemetry uplink connected', 'ok');
      } else {
        addEventLog('Telemetry uplink disconnected — attempting reconnection', 'warn');
      }
    });

    const unsubLatency = wsClient.on('latency', ({ latencyMs }) => {
      setWsLatency(latencyMs);
    });

    const unsubTelemetry = wsClient.on('telemetry:tick', (data) => {
      if (data?.telemetry) {
        setTelemetry(data.telemetry);
      }
    });

    const unsubAlarm = wsClient.on('alarm:triggered', (data) => {
      if (data?.event) {
        addEventLog(`ALARM: ${data.event.description}`, 'danger');
      }
    });

    return () => {
      unsubConnection();
      unsubLatency();
      unsubTelemetry();
      unsubAlarm();
    };
  }, [setTelemetry, setWsConnected, setWsLatency, setSources, addEventLog]);

  return (
    <div className="relative z-10 max-w-[1720px] mx-auto p-3 sm:p-5 min-h-screen flex flex-col justify-between">
      <div>
        <TopNavigation
          onOpenSourceModal={() => setIsSourceModalOpen(true)}
          onOpenPythonModal={() => setIsPythonModalOpen(true)}
        />
        <main className="transition-all duration-300">{children}</main>
      </div>

      <SystemStatusBar />

      {/* Modals */}
      <SourceManagerModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
      />
      <PythonBridgeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />
    </div>
  );
};
