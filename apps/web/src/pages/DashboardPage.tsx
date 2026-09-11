import React from 'react';
import { HeroSection } from '../components/Dashboard/HeroSection.js';
import { VideoStage } from '../components/SurveillanceViewer/VideoStage.js';
import { MotionHeatmap } from '../components/Dashboard/MotionHeatmap.js';
import { ProcessingPipeline } from '../components/Dashboard/ProcessingPipeline.js';
import { SystemHealthPanel } from '../components/Dashboard/SystemHealthPanel.js';
import { KalmanVelocityPanel } from '../components/Dashboard/KalmanVelocityPanel.js';
import { RadarPanel } from '../components/Dashboard/RadarPanel.js';
import { TargetList } from '../components/Dashboard/TargetCard.js';
import { EventTimeline } from '../components/Dashboard/EventTimeline.js';
import { TacticalSignalMatrix } from '../components/Dashboard/TacticalSignalMatrix.js';
import { AssetReconTerminal } from '../components/Dashboard/AssetReconTerminal.js';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <HeroSection />

      {/* Bento Grid (Faithful to V1 layout) */}
      <div className="bento grid grid-cols-1 lg:grid-cols-[1fr_310px] xl:grid-cols-[1fr_310px_290px] gap-4">
        {/* Main Column */}
        <div className="col-main flex flex-col gap-4">
          <VideoStage />
          <MotionHeatmap />
          <ProcessingPipeline />
        </div>

        {/* Middle Column */}
        <div className="col-mid flex flex-col gap-4">
          <SystemHealthPanel />
          <KalmanVelocityPanel />
          <RadarPanel />
        </div>

        {/* Right Column */}
        <div className="col-right flex flex-col gap-4">
          <TargetList />
          <EventTimeline />
          <TacticalSignalMatrix />
          <AssetReconTerminal />
        </div>
      </div>
    </div>
  );
};
