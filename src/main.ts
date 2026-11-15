// @ts-nocheck
import { GameEngine } from './core/GameEngine.ts';
import { loadSpaceWeather, pollSpaceWeather } from './data/spaceWeather.ts';
import { startLocalization } from './ui/i18n.ts';

export async function startGame() {
  startLocalization();
  const container = document.getElementById('game-container');
  const loadingOverlay = document.getElementById('loading-overlay');

  await document.fonts.load('16px "Monocraft"');

  // Let the browser paint the loading screen before building the world.
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        let engine;
        let liveWeatherStarted = false;
        const startLiveWeather = () => {
          if (liveWeatherStarted) return;
          liveWeatherStarted = true;

          // A API so e consultada quando o tutorial termina (ou e pulado). A primeira tempestade
          // ja foi montada a partir do snapshot embutido antes desta consulta.
          loadSpaceWeather({ forceRefresh: true }).then((spaceWeather) => {
            engine.applyLiveSpaceWeather(spaceWeather);
          });
          pollSpaceWeather((spaceWeather) => engine.applyLiveSpaceWeather(spaceWeather));
        };

        engine = new GameEngine(container, { onTutorialComplete: startLiveWeather });
        engine.start();
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
