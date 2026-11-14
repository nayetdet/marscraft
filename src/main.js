import './ui/styles/base.css';
import './ui/styles/hud.css';
import './ui/styles/modal.css';
import { GameEngine } from './core/GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  const engine = new GameEngine(container);
  engine.start();
});
