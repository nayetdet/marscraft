// @ts-nocheck
import { GameEngine } from './core/GameEngine.ts';
import { loadSpaceWeather } from './data/spaceWeather.ts';

// Clima espacial ao vivo do NASA DONKI (issue #100): o pedido sai ja no carregamento, em paralelo
// com a construcao do mundo. Nunca rejeita: sem rede, devolve o dado embutido no jogo.
const spaceWeatherPromise = loadSpaceWeather();

export async function startGame() {
  const container = document.getElementById('game-container');
  const loadingOverlay = document.getElementById('loading-overlay');

  await document.fonts.load('16px "Monocraft"');

  // Let the browser paint the loading screen before building the world.
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        const engine = new GameEngine(container);
        engine.start();
        // So vale se chegar antes do primeiro Play; depois, fica no cache para a proxima partida
        spaceWeatherPromise.then((spaceWeather) => engine.applySpaceWeather(spaceWeather));
        // So no `npm run dev`: deixa o motor acessivel no console para testar a historia e as animacoes
        if (process.env.NODE_ENV === 'development') window.__marscraft = engine;
        requestAnimationFrame(() => {
          loadingOverlay.classList.add('is-leaving');
          setTimeout(() => {
            loadingOverlay.classList.add('hidden');
          }, 350);
        });
      } catch (error) {
        loadingOverlay.classList.add('mc-loading-error');
        loadingOverlay.querySelector('.loading-caption').textContent = 'Unable to load the game. Please refresh.';
        console.error('MarsCraft failed to initialize:', error);
      }
    }, 80);
  });
}
