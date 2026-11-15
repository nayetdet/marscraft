import { afterEach, describe, expect, it } from 'vitest';
import {
  LANGUAGE_LABELS,
  LANGUAGE_STORAGE_KEY,
  LANGUAGES,
  checkTranslationCoverage,
  getLanguage,
  readLanguagePreference,
  setLanguage,
  translate,
} from './i18n.ts';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

afterEach(() => setLanguage('en', memoryStorage()));

describe('game language catalog', () => {
  it('offers English, Brazilian Portuguese, and Spanish with flags', () => {
    expect(LANGUAGES).toEqual(['en', 'pt-BR', 'es']);
    expect(LANGUAGE_LABELS).toEqual({
      en: '🇺🇸 English',
      'pt-BR': '🇧🇷 Português (Brasil)',
      es: '🇪🇸 Español',
    });
  });

  it('translates shared menu copy and falls back to the English source for unknown text', () => {
    expect(translate('Options', 'pt-BR')).toBe('Opções');
    expect(translate('Options', 'es')).toBe('Opciones');
    expect(translate('Skip ', 'pt-BR')).toBe('Pular ');
    expect(translate('Skip ', 'es')).toBe('Saltar ');
    expect(translate('POWER 72%', 'pt-BR')).toBe('ENERGIA 72%');
    expect(translate('Speed: 4 km/h', 'es')).toBe('Velocidad: 4 km/h');
    expect(translate('Real data from 15/11/2026', 'pt-BR')).toBe('Dados reais de 15/11/2026');
    expect(translate('NASA DONKI, real data from 15/11/2026', 'es')).toBe('NASA DONKI, datos reales del 15/11/2026');
    expect(translate('Distance calculated for 15/11/2026 from NASA/JPL planet orbits', 'pt-BR')).toContain('órbitas dos planetas da NASA/JPL');
    expect(translate('Your 3 clues say: Gale was a lake, good for life', 'es')).toBe('Tus 3 pistas indican: Gale fue un lago, un lugar donde pudo haber vida');
    expect(translate('After a 7-month trip from Earth, you reach Mars.', 'pt-BR')).toBe('Após uma viagem de 7 meses desde a Terra, você chega a Marte.');
    expect(translate('Touchdown! You are 225 million km from home.', 'es')).toBe('¡Aterrizaje! Estás a 225 millones de km de casa.');
    expect(translate('Nia brings lettuce from the greenhouse.', 'es')).toBe('Nia trae lechuga del invernadero.');
    expect(translate('Talk to Amira here to grab one.', 'pt-BR')).toBe('Fale com Amira aqui para pegar uma.');
    expect(translate('ACT 2 - STEP 3/8: FIND A CLUE', 'es')).toBe('ACTO 2 - PASO 3/8: ENCUENTRA UNA PISTA');
    expect(translate('FIRST: CHARGE THE ROVER', 'pt-BR')).toBe('PRIMEIRO: CARREGAR O ROVER');
    expect(translate('3 discoveries and 2 samples', 'es')).toBe('3 hallazgos y 2 muestras');
    expect(translate('CHARGED 100%', 'pt-BR')).toBe('CARREGADO 100%');
    expect(translate('100% (-60°C NIGHT READY)', 'es')).toBe('100% (-60°C LISTO PARA LA NOCHE)');
    expect(translate('Extra tubes make the rocket heavier (+2 ice each).', 'pt-BR')).toBe('Cada tubo extra deixa o foguete mais pesado (+2 bloco de gelo).');
    expect(translate(`Solar storm coming! The Sun threw out a giant cloud of particles (a CME). NASA's model said it would reach Mars on 18/11/2026: in the game that is 4h 20m from now. Based on a real CME that left the Sun on 15/11/2026 at 500 km/s, headed to Mars (NASA DONKI, real data from 15/11/2026).`, 'pt-BR'))
      .toContain('Tempestade solar a caminho!');
    expect(translate('POWER 72%', 'en')).toBe('POWER 72%');
    expect(translate('New untranslated text', 'es')).toBe('New untranslated text');
  });

  it('has matching translation keys in both non-English catalogs', () => {
    expect(checkTranslationCoverage()).toEqual({ 'pt-BR': [], es: [] });
  });

  it('saves and restores the language preference, using English for invalid values', () => {
    const storage = memoryStorage();
    setLanguage('pt-BR', storage);
    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt-BR');
    expect(readLanguagePreference(storage)).toBe('pt-BR');
    expect(getLanguage()).toBe('pt-BR');

    storage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    expect(readLanguagePreference(storage)).toBe('en');
  });
});
