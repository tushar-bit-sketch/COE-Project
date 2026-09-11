import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Camera,
  Crosshair,
  HardDrive,
  Layers,
  Lock,
  LogOut,
  Radio,
  Settings,
  Shield,
  Sliders,
  Terminal,
} from 'lucide-react';
import { useSurveillanceStore } from '../stores/useSurveillanceStore.js';
import { useAuthStore } from '../stores/useAuthStore.js';

interface TopNavigationProps {
  onOpenSourceModal?: () => void;
  onOpenPythonModal?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  onOpenSourceModal,
  onOpenPythonModal,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    telemetry,
    lockedTargetId,
    setLock,
    activeSource,
    activeAlarms,
    isWsConnected,
  } = useSurveillanceStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const hasCriticalAlarm = activeAlarms.some((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  const hasOcclusion = telemetry?.targets.some((t) => t.occluded);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Layers },
    { path: '/monitor', label: 'Monitor', icon: Crosshair },
    { path: '/targets', label: 'Targets', icon: Radio },
    { path: '/events', label: 'Events', icon: AlertTriangle, badge: activeAlarms.length },
    { path: '/sources', label: 'Sources', icon: Camera },
    { path: '/analytics', label: 'Analytics', icon: Activity },
    { path: '/system', label: 'System', icon: HardDrive },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const sourceLabel =
    activeSource?.type === 'SIMULATION'
      ? 'SIM'
      : activeSource?.type === 'WEBCAM'
      ? 'WEBCAM'
      : activeSource?.type === 'MJPEG'
      ? 'IP CAM'
      : 'OPTICAL';

  const statusText = hasCriticalAlarm
    ? 'THREAT ALERT'
    : lockedTargetId !== null
    ? `TARGET #${lockedTargetId} LOCKED`
    : hasOcclusion
    ? 'KALMAN PREDICTING'
    : activeSource?.type === 'SIMULATION'
    ? 'SIMULATION ACTIVE'
    : 'LIVE · AI DETECTION';

  return (
    <header className="header panel p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-black/40 backdrop-blur-xl">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center relative shadow-sm group-hover:border-cyan/50 transition-colors">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#38d9f5"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" opacity="0.4" />
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
              <path
                d="M9 12l2 2 4-4"
                stroke="#34d399"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="font-display text-[1.15rem] font-bold tracking-tight text-white flex items-center gap-1.5">
              SENTINEL-X
              <span className="text-[0.6rem] font-mono font-medium px-1.5 py-0.5 rounded bg-cyan/10 border border-cyan/30 text-cyan">
                v5.0
              </span>
            </div>
            <div className="text-[0.62rem] text-muted font-mono tracking-wider uppercase">
              Autonomous Surveillance Intelligence
            </div>
          </div>
        </Link>
      </div>

      {/* Operational Routes */}
      <nav className="hidden lg:flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                isActive
                  ? 'bg-cyan-dim border border-cyan/40 text-cyan font-semibold shadow-sm'
                  : 'text-muted hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={13} />
              <span>{link.label}</span>
              {typeof link.badge === 'number' && link.badge > 0 && (
                <span className="px-1.5 py-0.2 text-[0.55rem] font-bold rounded-full bg-red text-white animate-pulse">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Center Tactical Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {onOpenSourceModal && (
          <button
            onClick={onOpenSourceModal}
            className="font-mono text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-muted hover:text-white hover:border-cyan/40 transition-all flex items-center gap-1.5"
            title="Open Source Configuration"
          >
            <Camera size={13} />
            <span>⊞ Source Manager</span>
          </button>
        )}

        {onOpenPythonModal && (
          <button
            onClick={onOpenPythonModal}
            className="font-mono text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-muted hover:text-white hover:border-amber/40 transition-all flex items-center gap-1.5"
            title="Python YOLOv8 / DeepSORT Integration"
          >
            <span>⚡ Python Backend</span>
          </button>
        )}

        {lockedTargetId !== null && (
          <button
            onClick={() => setLock(null)}
            className="font-mono text-xs px-3 py-1.5 rounded-full border border-red/40 bg-red/10 text-red hover:bg-red/20 transition-all flex items-center gap-1.5 animate-pulse"
            title="Release locked target acquisition"
          >
            <Lock size={12} />
            <span>🔒 LOCKED #{lockedTargetId} · Release</span>
          </button>
        )}
      </div>

      {/* Right Telemetry & Status Badges */}
      <div className="flex items-center gap-2.5">
        {/* Source Chip */}
        <div className="font-mono text-[0.65rem] px-2.5 py-1 rounded-full bg-green/10 border border-green/30 text-green font-medium tracking-wide">
          {sourceLabel}
        </div>

        {/* Global Live State Badge */}
        <div className="flex items-center gap-2 font-mono text-[0.65rem] text-muted px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
          <div
            className={`w-2 h-2 rounded-full ${
              hasCriticalAlarm
                ? 'bg-red animate-redpulse'
                : hasOcclusion
                ? 'bg-amber'
                : 'bg-green animate-livepulse'
            }`}
          />
          <span
            className={
              hasCriticalAlarm ? 'text-red font-bold' : hasOcclusion ? 'text-amber' : 'text-text'
            }
          >
            {statusText}
          </span>
        </div>

        {/* Real-time FPS Chip */}
        <div className="font-mono text-[0.65rem] text-cyan px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20">
          {telemetry?.fps ? `${telemetry.fps.toFixed(1)} FPS` : '-- FPS'}
        </div>

        {/* Clearance Badge & Logout */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <div className="text-[0.65rem] font-mono text-white leading-tight font-medium">
                {user.username}
              </div>
              <div className="text-[0.55rem] font-mono text-cyan tracking-wider">
                {user.clearance || 'ALPHA-7'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-muted hover:text-red hover:border-red/40 transition-colors"
              title="Terminate Operator Session"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="font-mono text-xs px-3 py-1 rounded-full border border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20 transition-all"
          >
            LOGIN
          </Link>
        )}
      </div>
    </header>
  );
};
