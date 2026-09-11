import React, { useEffect, useState } from 'react';
import { Camera, Check, Globe, Play, Plus, Power, Radio, Shield, Trash2, X } from 'lucide-react';
import { api } from '../services/api.js';
import { CameraSourceData } from '@sentinel/shared';
import { useSurveillanceStore } from '../stores/useSurveillanceStore.js';

export const SourcesPage: React.FC = () => {
  const { activeSource, setSource, addEventLog } = useSurveillanceStore();
  const [sources, setSources] = useState<CameraSourceData[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'SIMULATION' | 'WEBCAM' | 'MJPEG' | 'RTSP_BRIDGE'>('MJPEG');
  const [url, setUrl] = useState('');
  const [resolution, setResolution] = useState('1280x720');
  const [fps, setFps] = useState(30);

  const loadSources = async () => {
    try {
      const res = await api.getSources();
      setSources(res.sources || []);
    } catch (e) {
      console.error('Failed to load sources:', e);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.testSource(id);
      setTestResults((prev) => ({
        ...prev,
        [id]: `✓ Reachable: ${res.latencyMs}ms latency · ${res.status}`,
      }));
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: `❌ Error: ${e.message}`,
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleActivate = async (source: CameraSourceData) => {
    try {
      await api.startSource(source.id);
      setSource(source);
      addEventLog(`Activated optical source: ${source.name}`, 'ok');
      loadSources();
    } catch (e: any) {
      console.error('Error activating source:', e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSource({
        name,
        type,
        url,
        resolution,
        fps,
        enabled: true,
      });
      setIsAddOpen(false);
      setName('');
      setUrl('');
      loadSources();
      addEventLog(`Configured new surveillance feed: ${name}`, 'ok');
    } catch (e: any) {
      alert(`Failed to add source: ${e.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Camera size={20} className="text-cyan" />
          <div>
            <h2 className="font-display font-bold text-base text-white tracking-tight">
              Surveillance Source Manager
            </h2>
            <p className="text-xs font-mono text-muted">
              Configure and test hardware streams, local optical feeds, and synthetic environments
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="font-mono text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-cyan/20 border border-cyan/40 text-cyan hover:bg-cyan/30 transition-all flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Add Stream Source</span>
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((s) => {
          const isActive = activeSource?.id === s.id;
          const testMsg = testResults[s.id];

          return (
            <div
              key={s.id}
              className={`panel p-5 border rounded-2xl transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-cyan/50 bg-cyan/[0.03] shadow-lg shadow-cyan/5'
                  : 'border-white/10 bg-black/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-cyan">
                      {s.type === 'SIMULATION' ? (
                        <Play size={16} />
                      ) : s.type === 'WEBCAM' ? (
                        <Camera size={16} />
                      ) : (
                        <Globe size={16} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-white">{s.name}</h3>
                      <span className="font-mono text-[0.62rem] text-dim uppercase tracking-wider">
                        {s.type} · {s.resolution} @ {s.fps} FPS
                      </span>
                    </div>
                  </div>

                  <div
                    className={`font-mono text-[0.6rem] px-2 py-0.5 rounded-full border ${
                      s.status === 'ONLINE'
                        ? 'bg-green/10 border-green/30 text-green font-semibold'
                        : 'bg-white/5 border-white/10 text-dim'
                    }`}
                  >
                    {s.status}
                  </div>
                </div>

                <div className="font-mono text-xs text-muted bg-white/[0.02] p-2.5 rounded-lg border border-white/5 mb-3 break-all">
                  {s.url || 'Internal deterministic simulation generator'}
                </div>

                {testMsg && (
                  <div className="font-mono text-[0.65rem] text-cyan bg-cyan/10 border border-cyan/20 p-2 rounded-lg mb-3">
                    {testMsg}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <button
                  onClick={() => handleTest(s.id)}
                  disabled={testingId === s.id}
                  className="font-mono text-[0.65rem] px-2.5 py-1 rounded border border-white/10 hover:border-cyan/40 text-muted hover:text-white transition-all"
                >
                  {testingId === s.id ? 'Testing...' : 'Test Ping'}
                </button>

                <button
                  onClick={() => handleActivate(s)}
                  className={`font-mono text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-green/20 border-green/50 text-green cursor-default'
                      : 'bg-white/[0.04] border-white/20 text-white hover:bg-cyan/20 hover:border-cyan/40'
                  }`}
                >
                  <Power size={12} />
                  <span>{isActive ? 'ACTIVE FEED' : 'ACTIVATE'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Source Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-2xl border border-cyan/30 bg-[#030810]/95 shadow-2xl">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="font-display font-bold text-base text-white mb-1">
              Add Surveillance Stream
            </h3>
            <p className="font-mono text-xs text-dim mb-4">
              Configure camera endpoint or media bridge
            </p>

            <form onSubmit={handleCreate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-dim mb-1 uppercase text-[0.65rem]">Source Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Sector C Optical Monitor"
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block text-dim mb-1 uppercase text-[0.65rem]">Source Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-[#030810] text-white focus:outline-none focus:border-cyan"
                >
                  <option value="MJPEG">MJPEG IP Stream</option>
                  <option value="WEBCAM">Local Webcam Optical</option>
                  <option value="RTSP_BRIDGE">RTSP Proxy Bridge</option>
                  <option value="SIMULATION">Synthetic Simulation</option>
                </select>
              </div>

              {type !== 'SIMULATION' && type !== 'WEBCAM' && (
                <div>
                  <label className="block text-dim mb-1 uppercase text-[0.65rem]">
                    Stream Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    placeholder="http://192.168.1.120:8080/stream.mjpg"
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-cyan"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-dim mb-1 uppercase text-[0.65rem]">Resolution</label>
                  <input
                    type="text"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full p-2 rounded-lg border border-white/10 bg-white/[0.04] text-white"
                  />
                </div>
                <div>
                  <label className="block text-dim mb-1 uppercase text-[0.65rem]">FPS Target</label>
                  <input
                    type="number"
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value, 10))}
                    className="w-full p-2 rounded-lg border border-white/10 bg-white/[0.04] text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan/20 border border-cyan/40 text-cyan font-semibold hover:bg-cyan/30"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
