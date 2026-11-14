import './ui/styles/base.css';
import './ui/styles/hud.css';
import './ui/styles/modal.css';
import { GameEngine } from './core/GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  const loadingOverlay = document.getElementById('loading-overlay');

  // Let the browser paint the loading screen before building the world.
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        const engine = new GameEngine(container);
        engine.start();
        requestAnimationFrame(() => {
          loadingOverlay.classList.add('is-leaving');
          setTimeout(() => loadingOverlay.classList.add('hidden'), 350);
        });
      } catch (error) {
        loadingOverlay.classList.add('mc-loading-error');
        loadingOverlay.querySelector('.loading-caption').textContent = 'Unable to load the game. Please refresh.';
        console.error('MineMars failed to initialize:', error);
      }
    }, 80);
  });
});
