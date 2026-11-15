'use client';

import { useEffect, useRef } from 'react';

function LoadingScreen() {
  return (
    <div id="loading-overlay" role="status" aria-live="polite">
      <div className="loading-content">
        <p className="loading-caption">Loading terrain...</p>
        <div className="loading-track"><div className="loading-progress" /></div>
      </div>
    </div>
  );
}

export default function GamePage() {
  const shellRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    async function mount() {
      try {
        // Fast Refresh reruns effects; the Three.js game must only mount once.
        if (shellRef.current?.querySelector('#game-container canvas')) return;
        const response = await fetch('/game.html', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Game shell HTTP ${response.status}`);
        const documentText = await response.text();
        const body = documentText.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? documentText;
        const { startGame } = await import('../main.ts');
        if (disposed || !shellRef.current) return;
        shellRef.current.innerHTML = body;
        void startGame();
      } catch (error) {
        console.error('MarsCraft failed to mount:', error);
        if (shellRef.current) shellRef.current.textContent = 'Unable to load the game. Please refresh.';
      }
    }
    mount();
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Next does not hot reload files fetched from public/. HEAD checks detect game shell changes.
    const paths = ['/game.html'];
    const versions = new Map<string, string>();
    let active = true;
    let checking = false;

    const checkPublicFiles = async () => {
      if (!active || checking || document.hidden) return;
      checking = true;
      try {
        for (const path of paths) {
          const response = await fetch(path, { method: 'HEAD', cache: 'no-store' });
          if (!response.ok || !active) continue;
          const version = response.headers.get('etag') ?? response.headers.get('last-modified');
          if (!version) continue;
          const previous = versions.get(path);
          if (previous && previous !== version) {
            window.location.reload();
            return;
          }
          versions.set(path, version);
        }
      } catch {
        // A temporary dev-server interruption should not reset the game.
      } finally {
        checking = false;
      }
    };

    void checkPublicFiles();
    const timer = window.setInterval(checkPublicFiles, 1500);
    document.addEventListener('visibilitychange', checkPublicFiles);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', checkPublicFiles);
    };
  }, []);

  return (
    <div ref={shellRef}>
      <LoadingScreen />
    </div>
  );
}
