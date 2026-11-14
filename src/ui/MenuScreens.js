// Telas extras do menu: "NASA Data" (fontes dos dados) e "Demo Controls" (atalhos para jurados).
// O menu principal e as telas trocam de lugar com a classe `hidden`, como a tela de controles.
export class MenuScreens {
  constructor({ donkiDate, onDemo }) {
    const menuMain = document.getElementById('menu-main');
    const feedback = document.getElementById('demo-feedback');
    document.getElementById('sources-donki-date').textContent = donkiDate;

    const bind = (name) => {
      const screen = document.getElementById(`${name}-screen`);
      document.getElementById(`${name}-btn`).addEventListener('click', () => {
        menuMain.classList.add('hidden');
        screen.classList.remove('hidden');
        menuMain.closest('.mc-menu-card').parentElement.closest('.mc-overlay').classList.add('menu-info-open');
      });
      document.getElementById(`${name}-back-btn`).addEventListener('click', () => {
        screen.classList.add('hidden');
        menuMain.classList.remove('hidden');
        menuMain.closest('.mc-menu-card').parentElement.closest('.mc-overlay').classList.remove('menu-info-open');
      });
      return screen;
    };
    bind('sources');
    bind('demo').addEventListener('click', (event) => {
      const action = event.target.closest('[data-demo]')?.dataset.demo;
      if (action) feedback.textContent = onDemo(action);
    });
  }
}
