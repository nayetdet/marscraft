'use client';

import { useEffect, useRef } from 'react';

export default function GamePage() {
  const shellRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    async function mount() {
      try {
        const response = await fetch('/game.html', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Game shell HTTP ${response.status}`);
        const documentText = await response.text();
        const body = documentText.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? documentText;
        if (disposed || !shellRef.current) return;
        shellRef.current.innerHTML = body;
        const { startGame } = await import('../main.ts');
        if (!disposed) startGame();
      } catch (error) {
        console.error('MarsCraft failed to mount:', error);
        if (shellRef.current) shellRef.current.textContent = 'Unable to load the game. Please refresh.';
      }
    }
    mount();
    return () => { disposed = true; };
  }, []);

  return <div ref={shellRef} />;
}
