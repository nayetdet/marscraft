import {
  FIRST_ICE_NO_ICE_TOAST, FIRST_ICE_ROCKET_TOAST, firstIceBatteryPct, firstIceRocketBad, firstIceRocketReport,
  firstIceTankGood, firstIceTankReport, firstIceTankToast, firstIceWaterL,
} from '../story/firstIceChoice.ts';

// Textos do trade-off do primeiro gelo (ato 1, issue #413) em pt-BR e es. As chaves com numero
// sao montadas pelas mesmas funcoes do card (src/story/firstIceChoice.ts): se uma constante
// mudar, a chave muda junto e a traducao continua valendo.
const liters = firstIceWaterL();
const battery = String(firstIceBatteryPct()).replace('.', ',');

export const FIRST_ICE_PT_BR: Record<string, string> = {
  'YOUR FIRST ICE': 'SEU PRIMEIRO GELO',
  'One ice block, two jobs: pick one': 'Um bloco de gelo, dois usos: escolha um',
  '36 g of water make 32 g of oxygen': '36 g de água viram 32 g de oxigênio',
  TANK: 'TANQUE',
  ROCKET: 'FOGUETE',
  [firstIceTankGood()]: `+${liters} L para beber e respirar`,
  'The rocket waits for this block': 'O foguete fica sem este bloco',
  'Fuel to fly home sooner': 'Combustível para voltar mais cedo',
  [firstIceRocketBad()]: `Gasta ${battery}% da bateria, sem água nova`,
  'Real: the Space Station makes oxygen from water (NASA OGA)': 'Real: a Estação Espacial faz oxigênio com água (NASA OGA)',
  [firstIceTankToast(liters)]: `Gelo no tanque da base: +${liters} L de água. O foguete ainda precisa deste bloco.`,
  [FIRST_ICE_ROCKET_TOAST]: 'Leve o gelo ao foguete: siga a seta. Fazer combustível gasta bateria.',
  [FIRST_ICE_NO_ICE_TOAST]: 'Não há gelo na sua mochila.',
  [firstIceTankReport()]: `Primeiro gelo: tanque da base (+${liters} L de água, o foguete esperou)`,
  [firstIceRocketReport()]: `Primeiro gelo: combustível do foguete (${battery}% da bateria, sem água nova)`,
};

export const FIRST_ICE_ES: Record<string, string> = {
  'YOUR FIRST ICE': 'TU PRIMER HIELO',
  'One ice block, two jobs: pick one': 'Un bloque de hielo, dos usos: elige uno',
  '36 g of water make 32 g of oxygen': '36 g de agua dan 32 g de oxígeno',
  TANK: 'TANQUE',
  ROCKET: 'COHETE',
  [firstIceTankGood()]: `+${liters} L para beber y respirar`,
  'The rocket waits for this block': 'El cohete se queda sin este bloque',
  'Fuel to fly home sooner': 'Combustible para volver antes',
  [firstIceRocketBad()]: `Gasta ${battery}% de la batería, sin agua nueva`,
  'Real: the Space Station makes oxygen from water (NASA OGA)': 'Real: la Estación Espacial produce oxígeno con agua (NASA OGA)',
  [firstIceTankToast(liters)]: `Hielo en el tanque de la base: +${liters} L de agua. El cohete aún necesita este bloque.`,
  [FIRST_ICE_ROCKET_TOAST]: 'Lleva el hielo al cohete: sigue la flecha. Hacer combustible gasta batería.',
  [FIRST_ICE_NO_ICE_TOAST]: 'No hay hielo en tu mochila.',
  [firstIceTankReport()]: `Primer hielo: tanque de la base (+${liters} L de agua, el cohete esperó)`,
  [firstIceRocketReport()]: `Primer hielo: combustible del cohete (${battery}% de la batería, sin agua nueva)`,
};
