import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Filter, ShieldAlert } from 'lucide-react';
import { api } from '../services/api.js';
import { useSurveillanceStore } from '../stores/useSurveillanceStore.js';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterAck, setFilterAck] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const { activeAlarms, acknowledgeAlarm } = useSurveillanceStore();

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEvents();
      setEvents(res.anomalies || []);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeAlarms]);

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlarm(id);
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, acknowledged: true, acknowledgedBy: 'admin' } : e))
    );
  };

  const filtered = events.filter((e) => {
    if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) return false;
    if (filterAck === 'PENDING' && e.acknowledged) return false;
    if (filterAck === 'ACKNOWLEDGED' && !e.acknowledged) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber" />
          <div>
            <h2 className="font-display font-bold text-base text-white tracking-tight">
              Security Event & Alarm Log
            </h2>
            <p className="text-xs font-mono text-muted">
              Behavioral anomaly classification audit trail and operator acknowledgment
            </p>
          </div>
        </div>

        {/* Severity Filters */}
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`font-mono text-xs px-3 py-1 rounded-lg border transition-all ${
                filterSeverity === sev
                  ? 'bg-amber/20 border-amber/40 text-amber font-bold'
                  : 'bg-white/[0.03] border-white/10 text-muted hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
          <button
            onClick={() => setFilterAck(filterAck === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`font-mono text-xs px-3 py-1 rounded-lg border transition-all ${
              filterAck === 'PENDING'
                ? 'bg-red/20 border-red/40 text-red font-bold'
                : 'bg-white/[0.03] border-white/10 text-muted hover:text-white'
            }`}
          >
            Pending Only
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="panel p-4 border border-white/10 bg-black/40 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-white/10 text-dim text-[0.65rem] uppercase tracking-wider">
              <th className="pb-3 pl-2">Timestamp</th>
              <th className="pb-3">Target</th>
              <th className="pb-3">Anomaly Type</th>
              <th className="pb-3">Severity</th>
              <th className="pb-3">Confidence</th>
              <th className="pb-3">Description</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 pr-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-dim">
                  NO EVENT RECORDS MATCHING CRITERIA
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 pl-2 text-dim whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 font-bold text-white">
                    TGT-{String(e.targetTrackNum || e.targetId).padStart(3, '0')}
                  </td>
                  <td className="py-3 text-cyan">{e.type}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[0.6rem] font-semibold ${
                        e.severity === 'CRITICAL'
                          ? 'bg-red/20 text-red border border-red/40'
                          : e.severity === 'HIGH'
                          ? 'bg-amber/20 text-amber border border-amber/40'
                          : 'bg-white/10 text-muted'
                      }`}
                    >
                      {e.severity}
                    </span>
                  </td>
                  <td className="py-3 text-muted">
                    {(e.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 text-muted max-w-xs truncate">
                    {e.description}
                  </td>
                  <td className="py-3">
                    {e.acknowledged ? (
                      <span className="text-green flex items-center gap-1">
                        <CheckCircle size={12} />
                        ACK ({e.acknowledgedBy || 'OP'})
                      </span>
                    ) : (
                      <span className="text-red animate-pulse flex items-center gap-1 font-semibold">
                        <Clock size={12} />
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-2 text-right">
                    {!e.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(e.id)}
                        className="font-mono text-[0.65rem] px-2.5 py-1 rounded bg-red/15 hover:bg-red/25 border border-red/40 text-red transition-all"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
