import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './styles/theme.css';

// Smooth tactical cursor glow effect
if (typeof window !== 'undefined') {
  let mx = -9999;
  let my = -9999;
  let cx = -9999;
  let cy = -9999;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  const animGlow = () => {
    const glow = document.getElementById('cursor-glow');
    if (glow) {
      cx += (mx - cx) * 0.08;
      cy += (my - cy) * 0.08;
      glow.style.left = `${cx}px`;
      glow.style.top = `${cy}px`;
    }
    requestAnimationFrame(animGlow);
  };

  requestAnimationFrame(animGlow);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
