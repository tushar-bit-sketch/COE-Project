import React, { useState } from 'react';
import { Bell, Key, Settings, ShieldCheck, Sliders, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore.js';
import { useSurveillanceStore } from '../stores/useSurveillanceStore.js';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { audioAlertsEnabled, toggleAudioAlerts, addEventLog } = useSurveillanceStore();

  const [confThreshold, setConfThreshold] = useState(0.35);
  const [anomalyZThreshold, setAnomalyZThreshold] = useState(2.8);
  const [predictionTimeout, setPredictionTimeout] = useState(35);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    addEventLog('Operator tracking parameters updated & calibrated', 'ok');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Settings size={20} className="text-cyan" />
          <div>
            <h2 className="font-display font-bold text-base text-white tracking-tight">
              Operational Calibration & Settings
            </h2>
            <p className="text-xs font-mono text-muted">
              Computer-vision sensitivities · prediction limits · operator security clearance
            </p>
          </div>
        </div>
        <div className="font-mono text-xs px-3 py-1 rounded-full bg-green/10 border border-green/30 text-green">
          CLEARANCE: {user?.clearance || 'ALPHA-7'}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Computer Vision Sensitivity */}
        <div className="panel p-5 border border-white/10 bg-black/40">
          <div className="flex items-center gap-2 mb-1">
            <Sliders size={16} className="text-cyan" />
            <h3 className="font-display font-bold text-sm text-white">
              Computer Vision & Detection Thresholds
            </h3>
          </div>
          <p className="font-mono text-xs text-muted mb-5">
            Calibrate confidence gates for neural inference bounding box generation
          </p>

          <div className="space-y-5 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-muted">Person Detection Confidence Threshold</span>
                <span className="text-cyan font-bold">
                  {(confThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan"
              />
              <div className="flex justify-between text-[0.6rem] text-dim mt-1">
                <span>0.10 (Permissive)</span>
                <span>0.35 (Default)</span>
                <span>0.90 (Strict)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-muted">Statistical Anomaly Sigma (\(Z\)-Score Threshold)</span>
                <span className="text-amber font-bold">{anomalyZThreshold.toFixed(1)}σ</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5.0"
                step="0.1"
                value={anomalyZThreshold}
                onChange={(e) => setAnomalyZThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber"
              />
              <div className="flex justify-between text-[0.6rem] text-dim mt-1">
                <span>1.5σ (Sensitive)</span>
                <span>2.8σ (Default)</span>
                <span>5.0σ (Conservative)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-muted">Kalman Occlusion Timeout</span>
                <span className="text-white font-bold">{predictionTimeout} frames (~1.1s)</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={predictionTimeout}
                onChange={(e) => setPredictionTimeout(parseInt(e.target.value, 10))}
                className="w-full accent-green"
              />
              <div className="flex justify-between text-[0.6rem] text-dim mt-1">
                <span>10 frames</span>
                <span>35 frames (Nominal)</span>
                <span>90 frames</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Alerts & Operator Preferences */}
        <div className="panel p-5 border border-white/10 bg-black/40">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} className="text-green" />
            <h3 className="font-display font-bold text-sm text-white">
              Tactical Audio & Operator Feedback
            </h3>
          </div>
          <p className="font-mono text-xs text-muted mb-4">
            Auditory chimes for target acquisition locks and anomaly triggers
          </p>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs">
            <div className="flex items-center gap-3">
              {audioAlertsEnabled ? (
                <Volume2 size={18} className="text-cyan" />
              ) : (
                <VolumeX size={18} className="text-dim" />
              )}
              <div>
                <div className="text-white font-semibold">Synthesized Tactical Cues</div>
                <span className="text-dim text-[0.65rem]">
                  Low-frequency audible pulses on lock acquisition
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAudioAlerts}
              className={`px-3 py-1 rounded-lg border font-semibold transition-all ${
                audioAlertsEnabled
                  ? 'bg-cyan/20 border-cyan/40 text-cyan'
                  : 'bg-white/5 border-white/10 text-muted'
              }`}
            >
              {audioAlertsEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <span className="font-mono text-xs text-green">
            {saved ? '✓ Settings calibrated & applied to active pipeline' : ''}
          </span>
          <button
            type="submit"
            className="font-mono text-xs font-semibold px-5 py-2.5 rounded-xl bg-cyan/20 border border-cyan/40 text-cyan hover:bg-cyan/30 transition-all shadow-lg"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
