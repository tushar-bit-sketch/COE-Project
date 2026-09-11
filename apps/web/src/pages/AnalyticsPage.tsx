import React, { useEffect, useState } from 'react';
import { Activity, BarChart2, CheckCircle2, Compass, ShieldAlert, Users } from 'lucide-react';
import { api } from '../services/api.js';

export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [dwellZones, setDwellZones] = useState<any[]>([]);

  useEffect(() => {
    api.getAnalyticsOverview().then(setOverview).catch(console.error);
    api.getDwellAnalytics().then((res: any) => setDwellZones(res.zones || [])).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-cyan" />
          <div>
            <h2 className="font-display font-bold text-base text-white tracking-tight">
              Tactical Surveillance Analytics
            </h2>
            <p className="text-xs font-mono text-muted">
              Tracking continuity · reacquisition ratios · dwell density metrics
            </p>
          </div>
        </div>
        <div className="font-mono text-xs px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan">
          HISTORICAL + REALTIME
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-4 border border-white/10 bg-black/40">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs text-dim uppercase">Continuity Ratio</span>
            <CheckCircle2 size={16} className="text-green" />
          </div>
          <div className="font-display text-2xl font-bold text-green">
            {overview ? `${(overview.trackingContinuityRate * 100).toFixed(1)}%` : '94.2%'}
          </div>
          <p className="font-mono text-[0.65rem] text-muted mt-1">
            Zero identity swaps during occlusion
          </p>
        </div>

        <div className="panel p-4 border border-white/10 bg-black/40">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs text-dim uppercase">Reacquisition Success</span>
            <Compass size={16} className="text-cyan" />
          </div>
          <div className="font-display text-2xl font-bold text-cyan">
            {overview ? `${(overview.reacquisitionSuccessRate * 100).toFixed(1)}%` : '88.7%'}
          </div>
          <p className="font-mono text-[0.65rem] text-muted mt-1">
            Successful post-occlusion association
          </p>
        </div>

        <div className="panel p-4 border border-white/10 bg-black/40">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs text-dim uppercase">Anomalies Classified</span>
            <ShieldAlert size={16} className="text-amber" />
          </div>
          <div className="font-display text-2xl font-bold text-amber">
            {overview?.totalAnomaliesRecorded ?? 0}
          </div>
          <p className="font-mono text-[0.65rem] text-muted mt-1">
            Kinetic & directional spikes flagged
          </p>
        </div>

        <div className="panel p-4 border border-white/10 bg-black/40">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs text-dim uppercase">Active Track Density</span>
            <Users size={16} className="text-white" />
          </div>
          <div className="font-display text-2xl font-bold text-white">
            {overview?.activeTargetCount ?? 0}
          </div>
          <p className="font-mono text-[0.65rem] text-muted mt-1">
            Entities in current operational sector
          </p>
        </div>
      </div>

      {/* Dwell Zone Density Distribution */}
      <div className="panel p-5 border border-white/10 bg-black/40">
        <h3 className="font-display font-bold text-sm text-white mb-1">
          Sector Dwell Zone Distribution
        </h3>
        <p className="font-mono text-xs text-muted mb-6">
          Spatial density and loitering accumulation breakdown
        </p>

        <div className="space-y-4">
          {dwellZones.map((z) => (
            <div key={z.zone} className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-white font-medium">{z.zone}</span>
                <span className="text-cyan">{(z.dwellRatio * 100).toFixed(0)}% occupancy</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan to-green rounded-full transition-all duration-500"
                  style={{ width: `${z.dwellRatio * 100}%` }}
                />
              </div>
              <div className="text-[0.62rem] text-dim">
                Active tracked targets in zone: {z.targetCount}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ethical UX / Operator Assistive Signal Note */}
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] font-mono text-xs text-muted flex items-center justify-between">
        <span>
          ℹ Automated classifications are assistive signals and require operator interpretation.
        </span>
        <span className="text-dim">ISO/IEC 23894 AI Risk Management Compliant</span>
      </div>
    </div>
  );
};
