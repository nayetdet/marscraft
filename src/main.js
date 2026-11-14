import './ui/styles/base.css';
import './ui/styles/hud.css';
import './ui/styles/modal.css';
import './ui/styles/story.css';
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
        // So no `npm run dev`: deixa o motor acessivel no console para testar a historia e as animacoes
        if (import.meta.env.DEV) window.__minemars = engine;
        requestAnimationFrame(() => {
          loadingOverlay.classList.add('is-leaving');
          setTimeout(() => {
            loadingOverlay.classList.add('hidden');
          }, 350);
        });
      } catch (error) {
        loadingOverlay.classList.add('mc-loading-error');
        loadingOverlay.querySelector('.loading-caption').textContent = 'Unable to load the game. Please refresh.';
        console.error('MineMars failed to initialize:', error);
      }
    }, 80);
  });
});
