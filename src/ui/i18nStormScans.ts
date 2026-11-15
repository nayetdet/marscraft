import { ACT2_CONFIG } from '../config/constants.ts';
import {
  DUST_DEVIL_ID, DUST_DEVIL_NOTICE, STORM_WALL_ID, STORM_WALL_NOTICE, stormScansMissedText,
} from '../story/acts/act2StormScans.ts';

// Textos das fichas raras que so existem na tempestade (ato 2, issue #419) em pt-BR e es: o
// aviso da chance, as duas fichas do scanner (src/data/scanCatalog.ts e os cartoes do diario em
// ScannerHud.ts) e a linha do boletim final. As chaves do aviso e do boletim sao montadas pelas
// mesmas constantes e funcoes do jogo (src/story/acts/act2StormScans.ts): se o texto mudar, a
// chave muda junto.
const wear = ACT2_CONFIG.STORM_SUIT_WEAR_MULTIPLIER;
const BOTH = [STORM_WALL_ID, DUST_DEVIL_ID] as const;

export const STORM_SCANS_PT_BR: Record<string, string> = {
  [STORM_WALL_NOTICE]: `Scan raro lá fora, só durante a tempestade: escaneie o céu cheio de poeira. A poeira gasta o traje ${wear}x mais rápido.`,
  [DUST_DEVIL_NOTICE]: 'Scan raro lá fora, só enquanto o redemoinho gira: escaneie o redemoinho. Sair gasta o ar do traje.',
  [stormScansMissedText([STORM_WALL_ID])]: 'Ciência que você deixou passar: Parede de poeira (scans que só existem na tempestade)',
  [stormScansMissedText([DUST_DEVIL_ID])]: 'Ciência que você deixou passar: Redemoinho de poeira (scans que só existem na tempestade)',
  [stormScansMissedText(BOTH)]: 'Ciência que você deixou passar: Parede de poeira, Redemoinho de poeira (scans que só existem na tempestade)',
  // Ficha: parede de poeira
  'Dust Storm Wall': 'Parede de poeira',
  'A wall of fine red dust that hides the Sun. You are standing inside it!': 'Uma parede de poeira vermelha e fina que esconde o Sol. Você está dentro dela!',
  'Dust in the air (tau)': 'Poeira no ar (tau)',
  '~0.5 on a clear day': '~0,5 em dia limpo',
  '2018 global storm': 'Tempestade global de 2018',
  'Tau 10.8, the highest ever measured on the ground': 'Tau 10,8, o maior já medido no chão de Marte',
  'Mars air is too thin to knock you over': 'O ar de Marte é fino demais para derrubar você',
  'Only outside, during a dust storm': 'Só lá fora, durante uma tempestade de poeira',
  'The dust blocks sunlight and covers the solar panels: less power for the whole base.': 'A poeira tapa a luz do Sol e cobre os painéis solares: menos energia para a base inteira.',
  'DUST WALL': 'PAREDE DE POEIRA', 'DUST WALL:': 'PAREDE DE POEIRA:',
  'TAU 10.8': 'TAU 10,8',
  'Clear day: tau 0.5': 'Dia limpo: tau 0,5',
  '2018 storm: tau 10.8': 'Tempestade de 2018: tau 10,8',
  'Scan only in a storm': 'Scan só na tempestade',
  'A wall of fine dust that hides the Sun and covers your panels.': 'Uma parede de poeira fina que esconde o Sol e cobre os seus painéis.',
  // Ficha: redemoinho
  'Dust Devil': 'Redemoinho de poeira',
  'A small whirlwind that lifts dust as it crosses the ground.': 'Um pequeno redemoinho que levanta poeira enquanto cruza o chão.',
  'Real event': 'Fato real',
  "09/03/2005: wind cleaned Spirit's panels, power up ~50%": '09/03/2005: o vento limpou os painéis do Spirit, energia ~50% maior',
  'Next day': 'No dia seguinte',
  'Spirit filmed dust devils nearby': 'O Spirit filmou redemoinhos por perto',
  'Only outside, while it spins': 'Só lá fora, enquanto ele gira',
  'Wind can sweep dust off solar panels and bring the power back.': 'O vento pode varrer a poeira dos painéis solares e trazer a energia de volta.',
  'DUST DEVIL': 'REDEMOINHO', 'DUST DEVIL:': 'REDEMOINHO:',
  '+50% POWER': '+50% DE ENERGIA',
  'Spirit rover, 2005': 'Rover Spirit, 2005',
  'Power up about 50%': 'Energia cerca de 50% maior',
  'Scan only while it spins': 'Scan só enquanto ele gira',
  "A small whirlwind! Wind once cleaned the Spirit rover's panels.": 'Um pequeno redemoinho! O vento já limpou os painéis do rover Spirit.',
};

export const STORM_SCANS_ES: Record<string, string> = {
  [STORM_WALL_NOTICE]: `Escaneo raro afuera, solo durante la tormenta: escanea el cielo lleno de polvo. El polvo gasta el traje ${wear}x más rápido.`,
  [DUST_DEVIL_NOTICE]: 'Escaneo raro afuera, solo mientras gira el remolino: escanea el remolino. Salir gasta el aire del traje.',
  [stormScansMissedText([STORM_WALL_ID])]: 'Ciencia que dejaste pasar: Muro de polvo (escaneos que solo existen en la tormenta)',
  [stormScansMissedText([DUST_DEVIL_ID])]: 'Ciencia que dejaste pasar: Remolino de polvo (escaneos que solo existen en la tormenta)',
  [stormScansMissedText(BOTH)]: 'Ciencia que dejaste pasar: Muro de polvo, Remolino de polvo (escaneos que solo existen en la tormenta)',
  // Ficha: muro de polvo
  'Dust Storm Wall': 'Muro de polvo',
  'A wall of fine red dust that hides the Sun. You are standing inside it!': 'Un muro de polvo rojo y fino que tapa el Sol. ¡Estás dentro de él!',
  'Dust in the air (tau)': 'Polvo en el aire (tau)',
  '~0.5 on a clear day': '~0,5 en un día despejado',
  '2018 global storm': 'Tormenta global de 2018',
  'Tau 10.8, the highest ever measured on the ground': 'Tau 10,8, el más alto medido en el suelo de Marte',
  'Mars air is too thin to knock you over': 'El aire de Marte es demasiado fino para derribarte',
  'Only outside, during a dust storm': 'Solo afuera, durante una tormenta de polvo',
  'The dust blocks sunlight and covers the solar panels: less power for the whole base.': 'El polvo tapa la luz del Sol y cubre los paneles solares: menos energía para toda la base.',
  'DUST WALL': 'MURO DE POLVO', 'DUST WALL:': 'MURO DE POLVO:',
  'TAU 10.8': 'TAU 10,8',
  'Clear day: tau 0.5': 'Día despejado: tau 0,5',
  '2018 storm: tau 10.8': 'Tormenta de 2018: tau 10,8',
  'Scan only in a storm': 'Escaneo solo en la tormenta',
  'A wall of fine dust that hides the Sun and covers your panels.': 'Un muro de polvo fino que tapa el Sol y cubre tus paneles.',
  // Ficha: remolino
  'Dust Devil': 'Remolino de polvo',
  'A small whirlwind that lifts dust as it crosses the ground.': 'Un pequeño remolino que levanta polvo mientras cruza el suelo.',
  'Real event': 'Hecho real',
  "09/03/2005: wind cleaned Spirit's panels, power up ~50%": '09/03/2005: el viento limpió los paneles de Spirit, energía ~50% mayor',
  'Next day': 'Al día siguiente',
  'Spirit filmed dust devils nearby': 'Spirit filmó remolinos cerca',
  'Only outside, while it spins': 'Solo afuera, mientras gira',
  'Wind can sweep dust off solar panels and bring the power back.': 'El viento puede barrer el polvo de los paneles solares y devolver la energía.',
  'DUST DEVIL': 'REMOLINO', 'DUST DEVIL:': 'REMOLINO:',
  '+50% POWER': '+50% DE ENERGÍA',
  'Spirit rover, 2005': 'Rover Spirit, 2005',
  'Power up about 50%': 'Energía cerca de 50% mayor',
  'Scan only while it spins': 'Escaneo solo mientras gira',
  "A small whirlwind! Wind once cleaned the Spirit rover's panels.": '¡Un pequeño remolino! El viento ya limpió los paneles del rover Spirit.',
};
