import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('sentinel2025');
  const [isGlitching, setIsGlitching] = useState(false);
  const [booting, setBooting] = useState(false);
  const [bootStep, setBootStep] = useState(0);

  const bootLines = [
    'Verifying operator credentials…',
    'Initializing neural inference engine…',
    'Loading tactical overlay system…',
    'Arming Kalman-6D prediction module…',
    'Calibrating anomaly detector…',
    'Target-locking subsystem online…',
    'System online — all units nominal',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const success = await login(username, password);

    if (success) {
      setBooting(true);
      runBootSequence();
    } else {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 800);
    }
  };

  const runBootSequence = () => {
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setBootStep(current);
      if (current >= bootLines.length) {
        clearInterval(interval);
        setTimeout(() => {
          navigate('/dashboard');
        }, 600);
      }
    }, 280);
  };

  if (booting) {
    const progress = Math.min(100, Math.round((bootStep / bootLines.length) * 100));

    return (
      <div className="fixed inset-0 z-50 bg-[#020202] flex flex-col items-center justify-center p-6">
        <div className="font-display text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-cyan mb-12 tracking-tight">
          SENTINEL-X
        </div>

        <div className="w-full max-w-sm space-y-3">
          {bootLines.map((line, idx) => {
            const isDone = idx < bootStep;
            const isActive = idx === bootStep;

            return (
              <div
                key={line}
                className={`flex items-center gap-3 font-mono text-xs transition-opacity duration-300 ${
                  isDone
                    ? 'text-muted'
                    : isActive
                    ? 'text-white'
                    : 'text-dim opacity-40'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isDone
                      ? 'bg-green shadow-[0_0_8px_#34d399]'
                      : isActive
                      ? 'bg-cyan shadow-[0_0_8px_#38d9f5] animate-ping'
                      : 'bg-dim'
                  }`}
                />
                <span>{line}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-sm h-1 bg-white/10 rounded-full mt-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan to-green transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#020202] flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md p-8 sm:p-10 rounded-3xl border border-cyan/25 bg-[#030810]/95 backdrop-blur-2xl shadow-2xl relative overflow-hidden ${
          isGlitching ? 'animate-glitch border-red' : ''
        }`}
      >
        <div className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 text-center tracking-tight mb-1">
          SENTINEL-X
        </div>
        <div className="font-mono text-[0.65rem] text-dim uppercase tracking-widest text-center mb-6">
          Secure Access Terminal · v5.0
        </div>

        {/* Animated Terminal Dots */}
        <div className="flex gap-2 justify-center mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan/70 animate-ping" />
          <div
            className="w-1.5 h-1.5 rounded-full bg-cyan/70 animate-ping"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full bg-cyan/70 animate-ping"
            style={{ animationDelay: '0.4s' }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[0.65rem] text-dim uppercase tracking-wider mb-2">
              Operator ID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-cyan/70 transition-all"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block font-mono text-[0.65rem] text-dim uppercase tracking-wider mb-2">
              Access Code
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:outline-none focus:border-cyan/70 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3 rounded-xl bg-cyan/15 hover:bg-cyan/25 border border-cyan/40 text-cyan font-display font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-cyan/10 active:scale-[0.99]"
          >
            {isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE →'}
          </button>
        </form>

        {error && (
          <div className="mt-4 font-mono text-xs text-red text-center tracking-wide">
            CRITICAL FAILURE: {error}
          </div>
        )}

        <div className="mt-8 font-mono text-[0.62rem] text-dim text-center leading-relaxed border-t border-white/5 pt-4">
          DEMO CREDENTIALS: <span className="text-muted">admin</span> /{' '}
          <span className="text-muted">sentinel2025</span>
          <br />
          Clearance: ALPHA-7 · Session encrypted (RSA-4096 / SHA-256)
        </div>
      </div>
    </div>
  );
};
